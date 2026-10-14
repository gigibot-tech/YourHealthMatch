/**
 * External systems application layer — patient prefs, suggest-other + notify.
 * Practice booking links live on practiceService.bookingLink.
 * Catalog SSOT: domain/externalSystems/catalog.ts
 */
import {
	EXTERNAL_SYSTEMS,
	externalSystemPrefsDefaults,
	getSystemById,
	mailtoSuggestOther,
	openUrlForSystem,
	resolveLaunches,
	systemsForContext,
	type AppLaunch,
	type ExternalSystem,
	type ExternalSystemPrefs,
	SUGGEST_OTHER_ID,
	CONTACT_EMAIL
} from '$lib/domain/externalSystems/catalog';
import { safeMerge } from '$lib/safeMerge';
import { practiceService } from './practiceService';

export type SuggestionNotifyPayload = {
	name: string;
	note: string;
	email?: string;
	role?: string;
	at: string;
};

type NotifyFn = (payload: SuggestionNotifyPayload) => void | Promise<void>;

const notifyListeners = new Set<NotifyFn>();

/** Register Slack/CRM/etc. without touching UI. */
export function onExternalSystemSuggested(fn: NotifyFn): () => void {
	notifyListeners.add(fn);
	return () => notifyListeners.delete(fn);
}

async function notifyExternalSystemSuggestion(
	payload: Omit<SuggestionNotifyPayload, 'at'> & { at?: string }
): Promise<void> {
	const full: SuggestionNotifyPayload = {
		...payload,
		at: payload.at ?? new Date().toISOString()
	};
	for (const fn of notifyListeners) {
		try {
			await fn(full);
		} catch (e) {
			console.error('suggestion notify failed', e);
		}
	}
	console.info('[yhm] external system suggested', full);
}

const STORAGE_KEY = 'yhm_external_systems_v1';
let memory: ExternalSystemPrefs | null = null;
const prefsListeners = new Set<(p: ExternalSystemPrefs) => void>();

function load(): ExternalSystemPrefs {
	if (memory) return memory;
	try {
		if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				memory = safeMerge(externalSystemPrefsDefaults, JSON.parse(raw));
				return memory;
			}
		}
	} catch {
		/* ignore */
	}
	memory = { ...externalSystemPrefsDefaults };
	return memory;
}

function persist(prefs: ExternalSystemPrefs) {
	memory = prefs;
	try {
		if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
		}
	} catch {
		/* ignore */
	}
	prefsListeners.forEach((fn) => fn(prefs));
}

export const externalSystemService = {
	listCatalog() {
		return EXTERNAL_SYSTEMS;
	},

	forContext(specialty?: string, location?: string) {
		return systemsForContext({ specialty, location });
	},

	getPrefs(): ExternalSystemPrefs {
		return load();
	},

	savePrefs(patch: Partial<ExternalSystemPrefs>): ExternalSystemPrefs {
		const next = safeMerge(externalSystemPrefsDefaults, safeMerge(load(), patch));
		persist(next);
		return next;
	},

	subscribe(fn: (p: ExternalSystemPrefs) => void) {
		prefsListeners.add(fn);
		fn(load());
		return () => prefsListeners.delete(fn);
	},

	savedSystems(): ExternalSystem[] {
		return load()
			.systemIds.map((id) => getSystemById(id))
			.filter((s): s is ExternalSystem => Boolean(s));
	},

	openSystem(id: string, preferApp = false): string | null {
		const s = getSystemById(id);
		if (!s) return null;
		return openUrlForSystem(s, preferApp);
	},

	/**
	 * Launch buttons: practice booking link (from practiceService) ∪ patient-saved apps.
	 */
	launchesFor(input: {
		practiceId?: string;
		doctorId?: string;
		doctorName?: string;
		specialty?: string;
		location?: string;
		includeContext?: boolean;
	}): AppLaunch[] {
		const out: AppLaunch[] = [];
		const seen = new Set<string>();

		if (input.practiceId) {
			const link = practiceService.bookingLink(input.practiceId, input.doctorId);
			if (link) {
				const practice = practiceService.get(input.practiceId);
				const doctor = input.doctorId
					? practice?.doctors.find((d) => d.id === input.doctorId)
					: practice?.doctors[0];
				const doctorName = input.doctorName || doctor?.name;
				seen.add(link.id);
				out.push({
					id: link.id,
					name: link.name,
					href: link.href,
					reason: 'practice_channel',
					label: doctorName
						? `Open ${doctorName} on ${link.name}`
						: `Book on ${link.name}`
				});
			}
		}

		const patientLaunches = resolveLaunches({
			patientSystemIds: load().systemIds,
			specialty: input.specialty,
			location: input.location,
			includeContext: input.includeContext
		});
		for (const launch of patientLaunches) {
			if (seen.has(launch.id)) continue;
			seen.add(launch.id);
			out.push(launch);
		}
		return out;
	},

	launch(href: string) {
		if (!href) return;
		if (href.startsWith('/')) window.location.href = href;
		else window.open(href, '_blank', 'noopener,noreferrer');
	},

	/** Notify hooks + mailto:contact@yourhealthmatch.com for missing catalog entries. */
	async suggestOther(input: {
		name: string;
		note?: string;
		email?: string;
		role?: string;
	}): Promise<{ mailto: string }> {
		const name = input.name.trim();
		if (!name) throw new Error('Please name the system');
		const note = (input.note || '').trim();
		await notifyExternalSystemSuggestion({
			name,
			note,
			email: input.email,
			role: input.role
		});
		this.savePrefs({
			suggestedName: name,
			suggestedNote: note,
			systemIds: [...new Set([...load().systemIds, SUGGEST_OTHER_ID])]
		});
		return { mailto: mailtoSuggestOther(name, note) };
	},

	contactEmail: CONTACT_EMAIL
};
