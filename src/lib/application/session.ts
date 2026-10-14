import { demoPatientRequirements, type PatientRequirements } from '$lib/domain/matching/matchDefaults';
import { preferences, role as roleStore, patchRequirements, resetRequirements } from '$lib/stores/app';
import { matchingService } from './matchingService';
import { practiceService } from './practiceService';

export type SessionRole = 'patient' | 'doctor';

/** Seeded Greifswald clinic used when skipping onboarding. */
export const DEMO_PRACTICE_ID = 'prac_turner';
export const DEMO_DOCTOR_ID = 'doc_turner';
export const DEMO_PATIENT_ID = 'pat_demo';

/** Patient profile (language + requirements + systems). Not separate nav tabs. */
export const PATIENT_PROFILE_PATH = '/patient/requirements';

/** Doctor “profile” is the practice setup page — never patient Profile. */
export const DOCTOR_PROFILE_PATH = '/doctor/practice';
/** Alias: practice setup is the doctor clinic record used for matching. */
export const DOCTOR_PRACTICE_PATH = DOCTOR_PROFILE_PATH;

export type StartSessionInput = {
	role: SessionRole;
	/** Skip profile setup (patient) or practice setup (doctor). */
	skipOnboarding: boolean;
};

/** Sidebar / empty video entry — always carry role so Back stays in-shell. */
export function videoPathForRole(role: SessionRole): string {
	return `/video?role=${role}`;
}

export function homePathForRole(role: SessionRole): string {
	return role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
}

/**
 * When an authenticated role hits the other portal, bounce them home.
 * Doctors who land on patient Profile go to practice setup instead.
 * Returns null when the path is allowed (or role is unset).
 */
export function portalRedirectForRole(role: SessionRole | null, pathname: string): string | null {
	if (!role) return null;
	if (role === 'doctor' && pathname.startsWith('/patient')) {
		if (pathname === PATIENT_PROFILE_PATH || pathname.startsWith(`${PATIENT_PROFILE_PATH}/`)) {
			return DOCTOR_PROFILE_PATH;
		}
		return homePathForRole('doctor');
	}
	if (role === 'patient' && pathname.startsWith('/doctor')) {
		return homePathForRole('patient');
	}
	return null;
}

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
		const supply = practiceService.clinicSupply();
		return matchingService.findMatches({ patient: demoPatientRequirements, supply }).length > 0;
	}
	const practice = practiceService.get(DEMO_PRACTICE_ID);
	if (!practice || !practiceService.isReady(practice)) return false;
	return (
		practiceService.openTimes({
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
	return DOCTOR_PROFILE_PATH;
}
