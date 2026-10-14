import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { demoPatientRequirements } from '$lib/domain/matching/matchDefaults';
import { matchingService } from './matchingService';
import { practiceService } from './practiceService';
import { patientRepo, practiceRepo } from '$lib/adapters/localRepos';
import { availabilityStore } from '$lib/adapters/availabilityStore';
import {
	applyDemoPatientData,
	canSkipOnboarding,
	DEMO_PRACTICE_ID,
	DOCTOR_PROFILE_PATH,
	homePathForRole,
	PATIENT_PROFILE_PATH,
	portalRedirectForRole,
	startSession,
	videoPathForRole
} from './session';
import { preferences, role } from '$lib/stores/app';
import { toISODate } from '$lib/domain/scheduling/slotCalendar';
import { practiceProfileDefaults } from '$lib/domain/practice/practiceProfileDefaults';
import { safeMerge } from '$lib/safeMerge';

describe('portal role guard', () => {
	it('keeps doctors out of the patient portal', () => {
		expect(portalRedirectForRole('doctor', '/patient/dashboard')).toBe('/doctor/dashboard');
		expect(portalRedirectForRole('doctor', '/patient/match')).toBe('/doctor/dashboard');
		expect(portalRedirectForRole('doctor', PATIENT_PROFILE_PATH)).toBe(DOCTOR_PROFILE_PATH);
		expect(portalRedirectForRole('doctor', '/doctor/dashboard')).toBeNull();
		expect(portalRedirectForRole('doctor', '/video')).toBeNull();
	});

	it('keeps patients out of the doctor portal', () => {
		expect(portalRedirectForRole('patient', '/doctor/dashboard')).toBe('/patient/dashboard');
		expect(portalRedirectForRole('patient', DOCTOR_PROFILE_PATH)).toBe('/patient/dashboard');
		expect(portalRedirectForRole('patient', '/patient/match')).toBeNull();
		expect(portalRedirectForRole(null, '/patient/dashboard')).toBeNull();
	});

	it('tags video entry with the session role', () => {
		expect(videoPathForRole('doctor')).toBe('/video?role=doctor');
		expect(videoPathForRole('patient')).toBe('/video?role=patient');
		expect(homePathForRole('doctor')).toBe('/doctor/dashboard');
		expect(homePathForRole('patient')).toBe('/patient/dashboard');
	});
});

describe('session start', () => {
	beforeEach(() => {
		role.set(null);
		patientRepo.save({ ...demoPatientRequirements, language: '', specialty: '' });
		preferences.set({ language: 'Arabic' });
	});

	it('sends a new patient through onboarding from the beginning', () => {
		expect(startSession({ role: 'patient', skipOnboarding: false })).toBe(PATIENT_PROFILE_PATH);
		expect(get(role)).toBe('patient');
		expect(patientRepo.get().language).toBe('');
		expect(patientRepo.get().specialty).toBe('');
		expect(patientRepo.get().insurance).toBe('');
		expect(patientRepo.get().location).toBe('');
		expect(get(preferences).language).toBe('');
	});

	it('skips patient onboarding with demo requirements that can match', () => {
		expect(matchingService.isPatientReady(demoPatientRequirements)).toEqual([]);
		expect(canSkipOnboarding('patient')).toBe(true);
		expect(startSession({ role: 'patient', skipOnboarding: true })).toBe('/patient/dashboard');
		const saved = patientRepo.get();
		expect(saved).toMatchObject(demoPatientRequirements);
		expect(matchingService.isPatientReady(saved)).toEqual([]);
		expect(matchingService.findMatches({ patient: saved, supply: practiceService.clinicSupply() }).length).toBeGreaterThan(0);
		expect(applyDemoPatientData()).toMatchObject(demoPatientRequirements);
	});

	it('keeps a separate stored profile for each new patient session', () => {
		startSession({ role: 'patient', skipOnboarding: false });
		patientRepo.save({ language: 'EN', location: 'Berlin' });
		const first = patientRepo.activeId();
		startSession({ role: 'patient', skipOnboarding: false });
		const second = patientRepo.activeId();
		expect(second).not.toBe(first);
		expect(patientRepo.get().location).toBe('');
		expect(patientRepo.getProfile(first)?.location).toBe('Berlin');
	});

	it('sends a new doctor to practice setup, or dashboard when skipping', () => {
		expect(canSkipOnboarding('doctor')).toBe(true);
		expect(startSession({ role: 'doctor', skipOnboarding: false })).toBe(DOCTOR_PROFILE_PATH);
		expect(get(role)).toBe('doctor');
		expect(startSession({ role: 'doctor', skipOnboarding: true })).toBe('/doctor/dashboard');
	});
});

describe('canSkipOnboarding', () => {
	const practicesSnap = practiceRepo.getAll();
	const offersSnap = availabilityStore.list();

	afterEach(() => {
		practiceRepo.replaceAll(practicesSnap);
		availabilityStore.replaceAll(offersSnap);
	});

	it('allows skip independently: doctor hours can exist when the demo patient cannot match', () => {
		const turner = practiceRepo.get(DEMO_PRACTICE_ID);
		if (!turner) throw new Error('expected seeded Turner practice');
		practiceRepo.save({
			...turner,
			specialties: ['Dentistry'],
			doctors: turner.doctors.map((d) => ({ ...d, specialty: 'Dentistry' }))
		});
		expect(canSkipOnboarding('patient')).toBe(false);
		expect(canSkipOnboarding('doctor')).toBe(true);
	});

	it('allows skip independently: demo patient can match when the demo doctor has no published hours', () => {
		availabilityStore.replaceAll(
			availabilityStore.list().filter((o) => o.doctorId !== 'doc_turner')
		);
		const soon = new Date();
		soon.setDate(soon.getDate() + 3);
		const soonIso = toISODate(soon);
		const alt = safeMerge(practiceProfileDefaults, {
			id: 'prac_alt',
			name: 'Alt Augen',
			languages: ['EN'],
			specialties: ['Ophthalmology'],
			insuranceAccepted: ['GKV'],
			kvApproved: true,
			location: 'Greifswald',
			postcode: '17489',
			acceptingNewPatients: true,
			onboardingStatus: 'available_for_matching' as const,
			modalities: ['video'],
			doctors: [
				{
					id: 'doc_alt',
					practiceId: 'prac_alt',
					name: 'Dr. Alt',
					specialty: 'Ophthalmology'
				}
			]
		});
		practiceRepo.replaceAll([...practiceRepo.getAll().filter((p) => p.id !== 'prac_alt'), alt]);
		availabilityStore.save({
			id: 'offer_alt',
			practiceId: 'prac_alt',
			doctorId: 'doc_alt',
			date: soonIso,
			time: '09:00',
			durationMin: 30
		});
		expect(canSkipOnboarding('doctor')).toBe(false);
		expect(matchingService.findMatches({ patient: demoPatientRequirements, supply: practiceService.clinicSupply() }).length).toBeGreaterThan(0);
		expect(canSkipOnboarding('patient')).toBe(true);
	});

	it('keeps skip requested but lands on onboarding when the demo clinic is missing', () => {
		practiceRepo.replaceAll([]);
		availabilityStore.replaceAll([]);
		expect(canSkipOnboarding('patient')).toBe(false);
		expect(canSkipOnboarding('doctor')).toBe(false);
		expect(startSession({ role: 'patient', skipOnboarding: true })).toBe(PATIENT_PROFILE_PATH);
		expect(startSession({ role: 'doctor', skipOnboarding: true })).toBe(DOCTOR_PROFILE_PATH);
	});
});
