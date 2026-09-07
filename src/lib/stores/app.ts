import { readable, writable } from 'svelte/store';
import { appointmentRepo, patientRepo, practiceRepo } from '$lib/adapters/localRepos';
import { availabilityStore } from '$lib/adapters/availabilityStore';
import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
import type { BookingDraft } from '$lib/application/services';
import { patientRequirementsDefaults } from '$lib/domain/matching/matchDefaults';

export const appointments = readable(appointmentRepo.getAll(), (set) =>
	appointmentRepo.subscribe(set)
);

export const practices = readable(practiceRepo.getAll(), (set) => practiceRepo.subscribe(set));

export const availability = readable(availabilityStore.list(), (set) =>
	availabilityStore.subscribe(() => set(availabilityStore.list()))
);

export const requirements = readable(patientRepo.get(), (set) => patientRepo.subscribe(set));

export const role = writable<'patient' | 'doctor' | null>(null);

if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
	try {
		const stored = localStorage.getItem('yhm_role') as 'patient' | 'doctor' | null;
		if (stored) role.set(stored);
	} catch {
		/* ignore */
	}
}

role.subscribe((r) => {
	try {
		if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function' && r) {
			localStorage.setItem('yhm_role', r);
		}
	} catch {
		/* ignore */
	}
});

export const bookingDraft = writable<Partial<BookingDraft>>({});
export const matchResults = writable<
	{ practiceId: string; doctorId?: string; score: number; reasons: string[] }[]
>([]);

export const preferences = writable<{ language: string }>({ language: '' });

export function patchRequirements(patch: Partial<PatientRequirements>) {
	return patientRepo.save(patch);
}

export function resetRequirements() {
	return patientRepo.save({ ...patientRequirementsDefaults });
}
