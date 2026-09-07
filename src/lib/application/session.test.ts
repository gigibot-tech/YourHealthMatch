import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { demoPatientRequirements } from '$lib/domain/matching/matchDefaults';
import { matchingService } from './matchingService';
import { patientRepo, practiceRepo } from '$lib/adapters/localRepos';
import { availabilityStore } from '$lib/adapters/availabilityStore';
import {
	applyDemoPatientData,
	canSkipOnboarding,
	DEMO_PRACTICE_ID,
	PATIENT_PROFILE_PATH,
	startSession
} from './session';
import { preferences, role } from '$lib/stores/app';

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
		expect(matchingService.findMatches(saved).length).toBeGreaterThan(0);
		expect(applyDemoPatientData()).toMatchObject(demoPatientRequirements);
	});

	it('sends a new doctor to practice setup, or dashboard when skipping', () => {
		expect(canSkipOnboarding('doctor')).toBe(true);
		expect(startSession({ role: 'doctor', skipOnboarding: false })).toBe('/doctor/practice');
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
		practiceRepo.save({ ...turner, specialties: ['Dentistry'] });
		expect(canSkipOnboarding('patient')).toBe(false);
		expect(canSkipOnboarding('doctor')).toBe(true);
	});

	it('allows skip independently: demo patient can match when the doctor has no published hours', () => {
		availabilityStore.replaceAll(
			availabilityStore.list().filter((o) => o.doctorId !== 'doc_turner')
		);
		expect(canSkipOnboarding('doctor')).toBe(false);
		expect(canSkipOnboarding('patient')).toBe(true);
	});

	it('keeps skip requested but lands on onboarding when the demo clinic is missing', () => {
		practiceRepo.replaceAll([]);
		availabilityStore.replaceAll([]);
		expect(canSkipOnboarding('patient')).toBe(false);
		expect(canSkipOnboarding('doctor')).toBe(false);
		expect(startSession({ role: 'patient', skipOnboarding: true })).toBe(PATIENT_PROFILE_PATH);
		expect(startSession({ role: 'doctor', skipOnboarding: true })).toBe('/doctor/practice');
	});
});
