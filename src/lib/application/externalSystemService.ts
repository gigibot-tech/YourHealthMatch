/**
 * External systems application layer — prefs, open URLs, suggest-other + notify.
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
import type { Practice } from '$lib/domain/practice/practiceProfileDefaults';
import { practiceRepo } from '$lib/adapters/localRepos';
import { safeMerge } from '$lib/safeMerge';

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
	 * Where to show launch buttons: patient prefs ∪ practice channel ∪ optional doctor.
	 * Pass practiceId to load practice bookingChannel / bookingUrl / doctor name.
	 */
	launchesFor(input: {
		practiceId?: string;
		doctorId?: string;
		doctorName?: string;
		specialty?: string;
		location?: string;
		includeContext?: boolean;
	}): AppLaunch[] {
		const practice: Practice | null = input.practiceId
			? practiceRepo.get(input.practiceId)
			: null;
		const doctor =
			practice && input.doctorId
				? practice.doctors.find((d) => d.id === input.doctorId)
				: undefined;
		const doctorName = input.doctorName || doctor?.name;

		return resolveLaunches({
			patientSystemIds: load().systemIds,
			practiceChannel: practice?.bookingChannel,
			practiceBookingUrl: practice?.bookingUrl,
			practiceName: practice?.name,
			doctorName,
			specialty: input.specialty || doctor?.specialty,
			location: input.location || practice?.location,
			includeContext: input.includeContext
		});
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
