import { demoPatientRequirements, type PatientRequirements } from '$lib/domain/matching/matchDefaults';
import { preferences, role as roleStore, patchRequirements, resetRequirements } from '$lib/stores/app';

export type SessionRole = 'patient' | 'doctor';

export type StartSessionInput = {
	role: SessionRole;
	/** Skip language/systems/requirements (patient) or practice setup (doctor). */
	skipOnboarding: boolean;
};

export function applyDemoPatientData(): PatientRequirements {
	preferences.set({ language: demoPatientRequirements.language });
	return patchRequirements(demoPatientRequirements);
}

/** Returns the first route for that role. Always start from `/` (role picker). */
export function startSession(input: StartSessionInput): string {
	roleStore.set(input.role);
	if (input.role === 'patient') {
		if (input.skipOnboarding) {
			applyDemoPatientData();
			return '/patient/dashboard';
		}
		resetRequirements();
		preferences.set({ language: '' });
		return '/patient/language';
	}
	if (input.skipOnboarding) return '/doctor/dashboard';
	return '/doctor/practice';
}
