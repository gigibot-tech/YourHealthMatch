import { demoPatientRequirements, type PatientRequirements } from '$lib/domain/matching/matchDefaults';
import { preferences, role as roleStore, patchRequirements, resetRequirements } from '$lib/stores/app';
import { matchingService } from './matchingService';
import { practiceService } from './practiceService';
import { availabilityService } from './availabilityService';

export type SessionRole = 'patient' | 'doctor';

/** Seeded Greifswald clinic used when skipping onboarding. */
export const DEMO_PRACTICE_ID = 'prac_turner';
export const DEMO_DOCTOR_ID = 'doc_turner';
export const DEMO_PATIENT_ID = 'pat_demo';

/** Patient profile (language + requirements + systems). Not separate nav tabs. */
export const PATIENT_PROFILE_PATH = '/patient/requirements';

export type StartSessionInput = {
	role: SessionRole;
	/** Skip profile setup (patient) or practice setup (doctor). */
	skipOnboarding: boolean;
};

export function applyDemoPatientData(): PatientRequirements {
	preferences.set({ language: demoPatientRequirements.language });
	return patchRequirements(demoPatientRequirements);
}

/**
 * Skip is only safe when the demo clinic can land on a real dashboard.
 * Patient and doctor are independent (demo match vs seeded clinic hours).
 */
export function canSkipOnboarding(role: SessionRole): boolean {
	if (role === 'patient') {
		if (matchingService.isPatientReady(demoPatientRequirements).length > 0) return false;
		return matchingService.findMatches(demoPatientRequirements).length > 0;
	}
	const practice = practiceService.get(DEMO_PRACTICE_ID);
	if (!practice || !practiceService.isReady(practice)) return false;
	return (
		availabilityService.listPublished({
			practiceId: DEMO_PRACTICE_ID,
			doctorId: DEMO_DOCTOR_ID
		}).length > 0
	);
}

/** Returns the first route for that role. Always start from `/` (role picker). */
export function startSession(input: StartSessionInput): string {
	roleStore.set(input.role);
	const skip = input.skipOnboarding && canSkipOnboarding(input.role);
	if (input.role === 'patient') {
		if (skip) {
			applyDemoPatientData();
			return '/patient/dashboard';
		}
		resetRequirements();
		preferences.set({ language: '' });
		return PATIENT_PROFILE_PATH;
	}
	if (skip) return '/doctor/dashboard';
	return '/doctor/practice';
}
