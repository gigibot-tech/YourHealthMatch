import { describe, expect, it, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { demoPatientRequirements } from '$lib/domain/matching/matchDefaults';
import { matchingService } from './matchingService';
import { patientRepo } from '$lib/adapters/localRepos';
import { applyDemoPatientData, startSession } from './session';
import { preferences, role } from '$lib/stores/app';

describe('session start', () => {
	beforeEach(() => {
		role.set(null);
		patientRepo.save({ ...demoPatientRequirements, language: '', specialty: '' });
		preferences.set({ language: 'Arabic' });
	});

	it('sends a new patient through onboarding from the beginning', () => {
		expect(startSession({ role: 'patient', skipOnboarding: false })).toBe('/patient/language');
		expect(get(role)).toBe('patient');
		expect(patientRepo.get().language).toBe('');
		expect(patientRepo.get().specialty).toBe('');
		expect(patientRepo.get().insurance).toBe('');
		expect(patientRepo.get().location).toBe('');
		expect(get(preferences).language).toBe('');
	});

	it('skips patient onboarding with local demo requirements that can match', () => {
		expect(matchingService.isPatientReady(demoPatientRequirements)).toEqual([]);
		expect(startSession({ role: 'patient', skipOnboarding: true })).toBe('/patient/dashboard');
		const saved = patientRepo.get();
		expect(saved).toMatchObject(demoPatientRequirements);
		expect(matchingService.isPatientReady(saved)).toEqual([]);
		expect(matchingService.findMatches(saved).length).toBeGreaterThan(0);
		expect(applyDemoPatientData()).toMatchObject(demoPatientRequirements);
	});

	it('sends a new doctor to practice setup, or dashboard when skipping', () => {
		expect(startSession({ role: 'doctor', skipOnboarding: false })).toBe('/doctor/practice');
		expect(get(role)).toBe('doctor');
		expect(startSession({ role: 'doctor', skipOnboarding: true })).toBe('/doctor/dashboard');
	});
});
