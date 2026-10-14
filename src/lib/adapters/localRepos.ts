/**
 * localStorage adapters — persistence only. Types live in domain.
 */
import { safeMerge } from '$lib/safeMerge';
import { channelFor, type Appointment } from '$lib/domain/appointment/Appointment';
import type { Practice } from '$lib/domain/practice/practiceProfileDefaults';
import { practiceProfileDefaults } from '$lib/domain/practice/practiceProfileDefaults';
import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
import { patientRequirementsDefaults } from '$lib/domain/matching/matchDefaults';
import type { Interest } from '$lib/domain/interest/interest';
import { toISODate } from '$lib/domain/scheduling/slotCalendar';

export type { Appointment };

type Listener<T> = (all: T[]) => void;

export function createLocalRepo<T extends { id: string }>(
	storageKey: string,
	seed: () => T[],
	opts?: { reseedIfEmpty?: boolean }
) {
	let cache: T[] | null = null;
	const listeners = new Set<Listener<T>>();

	function load(): T[] {
		if (cache) return cache;
		try {
			if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
				const raw = localStorage.getItem(storageKey);
				if (!raw) {
					cache = seed();
					try {
						localStorage.setItem(storageKey, JSON.stringify(cache));
					} catch {
						/* ignore */
					}
					return cache;
				}
				const parsed = JSON.parse(raw);
				cache = Array.isArray(parsed) ? parsed : seed();
				if (opts?.reseedIfEmpty && cache!.length === 0) {
					cache = seed();
					try {
						localStorage.setItem(storageKey, JSON.stringify(cache));
					} catch {
						/* ignore */
					}
				}
				return cache!;
			}
		} catch {
			/* fall through */
		}
		cache = seed();
		return cache;
	}

	function persist(list: T[]) {
		cache = list;
		try {
			if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
				localStorage.setItem(storageKey, JSON.stringify(list));
			}
		} catch {
			/* non-browser / incomplete localStorage */
		}
		listeners.forEach((fn) => {
			try {
				fn(list.slice());
			} catch (e) {
				console.error(e);
			}
		});
	}

	return {
		getAll(): T[] {
			return load().slice();
		},
		get(id: string): T | null {
			return load().find((x) => x.id === id) ?? null;
		},
		save(item: T): T {
			const list = load().slice();
			const idx = list.findIndex((x) => x.id === item.id);
			if (idx >= 0) list[idx] = item;
			else list.push(item);
			persist(list);
			return item;
		},
		replaceAll(items: T[]) {
			persist(items.slice());
		},
		remove(id: string) {
			persist(load().filter((x) => x.id !== id));
		},
		subscribe(listener: Listener<T>): () => void {
			listeners.add(listener);
			listener(load().slice());
			return () => listeners.delete(listener);
		}
	};
}

function seedPractices(): Practice[] {
	return [
		safeMerge(practiceProfileDefaults, {
			id: 'prac_turner',
			name: 'Augenpraxis Turner',
			languages: ['EN', 'DE', 'AR'],
			specialties: ['Ophthalmology', 'General Practitioner', 'Dermatology'],
			insuranceAccepted: ['GKV', 'PKV'],
			kvApproved: true,
			location: 'Greifswald',
			postcode: '17489',
			lat: 54.0865,
			lng: 13.3923,
			acceptingNewPatients: true,
			onboardingStatus: 'available_for_matching' as const,
			modalities: ['in_person', 'video'],
			bookingChannel: 'direct' as const,
			doctors: [
				{
					id: 'doc_turner',
					practiceId: 'prac_turner',
					name: 'Dr. Olivia Turner, M.D.',
					specialty: 'Ophthalmology',
					videoEnabled: true
				},
				{
					id: 'doc_chen',
					practiceId: 'prac_turner',
					name: 'Dr. Michael Chen',
					specialty: 'Dermatology',
					videoEnabled: true
				}
			]
		}),
		safeMerge(practiceProfileDefaults, {
			id: 'prac_davis',
			name: 'Hausarztpraxis Davis',
			languages: ['DE', 'EN'],
			specialties: ['General Practitioner', 'Dentist'],
			insuranceAccepted: ['GKV'],
			kvApproved: true,
			location: 'Greifswald',
			postcode: '17489',
			lat: 54.095,
			lng: 13.41,
			acceptingNewPatients: true,
			onboardingStatus: 'available_for_matching' as const,
			bookingChannel: 'doctolib' as const,
			bookingUrl: 'https://www.doctolib.de/praxis/greifswald',
			doctors: [
				{
					id: 'doc_davis',
					practiceId: 'prac_davis',
					name: 'Dr. Emily Davis',
					specialty: 'General Practitioner',
					videoEnabled: true
				}
			]
		})
	];
}

function addDaysISO(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return toISODate(d);
}

function seedAppointments(): Appointment[] {
	const today = toISODate(new Date());
	const demo: Omit<Appointment, 'channel'>[] = [
		{
			id: 'appt_today_1',
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			patientId: 'pat_demo',
			patientName: 'John Doe',
			reason: 'Examination for eyesight',
			date: today,
			time: '10:00',
			status: 'confirmed',
			modality: 'video'
		},
		{
			id: 'appt_today_2',
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			patientId: 'pat_maria',
			patientName: 'Maria Lopez',
			reason: 'Post-op review',
			date: today,
			time: '11:00',
			status: 'confirmed',
			modality: 'video'
		},
		{
			id: 'appt_today_3',
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			patientId: 'pat_alex',
			patientName: 'Alex Kim',
			reason: 'Vision screening',
			date: today,
			time: '14:00',
			status: 'requested',
			modality: 'video'
		},
		{
			id: 'appt_seed_2',
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			patientId: 'pat_demo',
			patientName: 'John Doe',
			reason: 'Skin check',
			date: addDaysISO(5),
			time: '14:30',
			status: 'confirmed',
			modality: 'in_person'
		},
		{
			id: 'appt_seed_3',
			practiceId: 'prac_davis',
			doctorId: 'doc_davis',
			patientId: 'pat_demo',
			patientName: 'John Doe',
			reason: 'Annual checkup',
			date: addDaysISO(2),
			time: '09:00',
			status: 'requested',
			modality: 'in_person'
		}
	];
	return demo.map((a) => ({ ...a, channel: channelFor(a.id) }));
}

export const practiceRepo = createLocalRepo<Practice>('yhm_practices_v1', seedPractices);
export const appointmentRepo = createLocalRepo<Appointment>('yhm_appointments_v1', seedAppointments, {
	reseedIfEmpty: true
});
export const interestRepo = createLocalRepo<Interest>('yhm_interest_v1', () => []);
const PROFILES_KEY = 'yhm_patient_profiles_v1';
const LEGACY_PATIENT_KEY = 'yhm_patient_reqs_v1';

type PatientProfileStore = {
	activeId: string;
	profiles: Record<string, PatientRequirements>;
};

const patientListeners = new Set<(r: PatientRequirements) => void>();
let memoryProfiles: PatientProfileStore | null = null;

export function createProfileId(): string {
	const id = globalThis.crypto?.randomUUID?.();
	return `pat_${id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`}`;
}

function emptyStore(activeId = createProfileId()): PatientProfileStore {
	return {
		activeId,
		profiles: { [activeId]: { ...patientRequirementsDefaults } }
	};
}

function readRaw(key: string): string | null {
	try {
		if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
			return localStorage.getItem(key);
		}
	} catch {
		/* ignore */
	}
	return null;
}

function writeRaw(key: string, value: string) {
	try {
		if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
			localStorage.setItem(key, value);
		}
	} catch {
		/* ignore */
	}
}

function normalizeStore(raw: unknown): PatientProfileStore | null {
	if (!raw || typeof raw !== 'object') return null;
	const record = raw as Partial<PatientProfileStore>;
	if (!record.activeId || !record.profiles || typeof record.profiles !== 'object') return null;
	const profiles: Record<string, PatientRequirements> = {};
	for (const [id, profile] of Object.entries(record.profiles)) {
		profiles[id] = safeMerge(patientRequirementsDefaults, profile);
	}
	if (!profiles[record.activeId]) {
		profiles[record.activeId] = { ...patientRequirementsDefaults };
	}
	return { activeId: record.activeId, profiles };
}

function loadProfiles(): PatientProfileStore {
	if (memoryProfiles) return memoryProfiles;
	const parsed = readRaw(PROFILES_KEY);
	if (parsed) {
		try {
			const store = normalizeStore(JSON.parse(parsed));
			if (store) {
				memoryProfiles = store;
				return store;
			}
		} catch {
			/* fall through */
		}
	}
	const legacy = readRaw(LEGACY_PATIENT_KEY);
	if (legacy) {
		try {
			const activeId = createProfileId();
			const store: PatientProfileStore = {
				activeId,
				profiles: {
					[activeId]: safeMerge(patientRequirementsDefaults, JSON.parse(legacy))
				}
			};
			memoryProfiles = store;
			persistProfiles(store);
			return store;
		} catch {
			/* fall through */
		}
	}
	memoryProfiles = emptyStore();
	return memoryProfiles;
}

function persistProfiles(store: PatientProfileStore) {
	memoryProfiles = store;
	writeRaw(PROFILES_KEY, JSON.stringify(store));
	const active = store.profiles[store.activeId] ?? { ...patientRequirementsDefaults };
	patientListeners.forEach((fn) => fn(active));
}

export const patientRepo = {
	activeId(): string {
		return loadProfiles().activeId;
	},

	/** One stored profile per session id. Older sessions stay in the map. */
	begin(id: string, initial: PatientRequirements): PatientRequirements {
		const store = loadProfiles();
		const next: PatientProfileStore = {
			activeId: id,
			profiles: {
				...store.profiles,
				[id]: safeMerge(patientRequirementsDefaults, initial)
			}
		};
		persistProfiles(next);
		return next.profiles[id];
	},

	getProfile(id: string): PatientRequirements | null {
		const profile = loadProfiles().profiles[id];
		return profile ? safeMerge(patientRequirementsDefaults, profile) : null;
	},

	get(): PatientRequirements {
		const store = loadProfiles();
		return safeMerge(
			patientRequirementsDefaults,
			store.profiles[store.activeId] ?? patientRequirementsDefaults
		);
	},

	save(patch: Partial<PatientRequirements>): PatientRequirements {
		const store = loadProfiles();
		const current = store.profiles[store.activeId] ?? patientRequirementsDefaults;
		const nextProfile = safeMerge(patientRequirementsDefaults, safeMerge(current, patch));
		persistProfiles({
			activeId: store.activeId,
			profiles: { ...store.profiles, [store.activeId]: nextProfile }
		});
		return nextProfile;
	},

	subscribe(listener: (r: PatientRequirements) => void): () => void {
		patientListeners.add(listener);
		listener(this.get());
		return () => patientListeners.delete(listener);
	}
};
