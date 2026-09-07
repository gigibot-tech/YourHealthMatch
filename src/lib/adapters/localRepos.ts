/**
 * localStorage adapters — persistence only. Types live in domain.
 */
import { safeMerge } from '$lib/safeMerge';
import type { Appointment } from '$lib/domain/appointment/Appointment';
import type { Practice } from '$lib/domain/practice/practiceProfileDefaults';
import { practiceProfileDefaults } from '$lib/domain/practice/practiceProfileDefaults';
import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
import { patientRequirementsDefaults } from '$lib/domain/matching/matchDefaults';
import type { Interest } from '$lib/domain/interest/interest';

export type { Appointment };

type Listener<T> = (all: T[]) => void;

function createLocalRepo<T extends { id: string }>(storageKey: string, seed: () => T[]) {
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
			languages: ['English', 'German', 'Arabic'],
			specialties: ['Ophthalmology', 'General Practitioner', 'Dermatology'],
			insuranceAccepted: ['GKV', 'PKV'],
			location: 'Greifswald',
			postcode: '17489',
			acceptingNewPatients: true,
			onboardingStatus: 'available_for_matching' as const,
			modalities: ['in_person', 'video'],
			bookingChannel: 'direct' as const,
			doctors: [
				{
					id: 'doc_turner',
					practiceId: 'prac_turner',
					name: 'Dr. Olivia Turner, M.D.',
					specialty: 'Ophthalmology'
				},
				{
					id: 'doc_chen',
					practiceId: 'prac_turner',
					name: 'Dr. Michael Chen',
					specialty: 'Dermatology'
				}
			]
		}),
		safeMerge(practiceProfileDefaults, {
			id: 'prac_davis',
			name: 'Hausarztpraxis Davis',
			languages: ['German', 'English'],
			specialties: ['General Practitioner', 'Dentist'],
			insuranceAccepted: ['GKV'],
			location: 'Greifswald',
			postcode: '17489',
			acceptingNewPatients: true,
			onboardingStatus: 'available_for_matching' as const,
			bookingChannel: 'doctolib' as const,
			bookingUrl: 'https://www.doctolib.de/praxis/greifswald',
			doctors: [
				{
					id: 'doc_davis',
					practiceId: 'prac_davis',
					name: 'Dr. Emily Davis',
					specialty: 'General Practitioner'
				}
			]
		})
	];
}

export const practiceRepo = createLocalRepo<Practice>('yhm_practices_v1', seedPractices);
export const appointmentRepo = createLocalRepo<Appointment>('yhm_appointments_v1', () => []);
export const interestRepo = createLocalRepo<Interest>('yhm_interest_v1', () => []);
const PATIENT_KEY = 'yhm_patient_reqs_v1';
const patientListeners = new Set<(r: PatientRequirements) => void>();
let memoryPatient: PatientRequirements | null = null;

export const patientRepo = {
	get(): PatientRequirements {
		try {
			if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
				const raw = localStorage.getItem(PATIENT_KEY);
				if (!raw) return memoryPatient ?? { ...patientRequirementsDefaults };
				return safeMerge(patientRequirementsDefaults, JSON.parse(raw));
			}
		} catch {
			/* fall through */
		}
		return memoryPatient ?? { ...patientRequirementsDefaults };
	},
	save(patch: Partial<PatientRequirements>): PatientRequirements {
		const next = safeMerge(patientRequirementsDefaults, safeMerge(this.get(), patch));
		memoryPatient = next;
		try {
			if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
				localStorage.setItem(PATIENT_KEY, JSON.stringify(next));
			}
		} catch {
			/* ignore */
		}
		patientListeners.forEach((fn) => fn(next));
		return next;
	},
	subscribe(listener: (r: PatientRequirements) => void): () => void {
		patientListeners.add(listener);
		listener(this.get());
		return () => patientListeners.delete(listener);
	}
};
