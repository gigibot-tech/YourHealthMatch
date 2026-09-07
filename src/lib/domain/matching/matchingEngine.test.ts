import { describe, expect, it } from 'vitest';
import { safeMerge } from '$lib/safeMerge';
import {
	MATCH_REQUIRED_PATIENT,
	MATCH_REQUIRED_PRACTICE,
	patientRequirementsDefaults,
	practiceProfileDefaults
} from './matchDefaults';
import { findMatches } from './matchingEngine';
import { missingRequired } from '$lib/safeMerge';
import type { Practice } from '../practice/practiceProfileDefaults';

const completePatient = safeMerge(patientRequirementsDefaults, {
	language: 'Arabic',
	specialty: 'Dermatology',
	insurance: 'GKV' as const,
	location: 'Greifswald',
	newPatient: true,
	postcode: '17489',
	krankenkasse: 'TK',
	city: 'Greifswald'
});

const completePractice: Practice = safeMerge(practiceProfileDefaults, {
	id: 'prac_1',
	name: 'Hautarztpraxis Nord',
	languages: ['Arabic', 'German', 'English'],
	specialties: ['Dermatology', 'General Practitioner'],
	insuranceAccepted: ['GKV', 'PKV'],
	location: 'Greifswald',
	postcode: '17489',
	acceptingNewPatients: true,
	onboardingStatus: 'available_for_matching' as const,
	doctors: [
		{
			id: 'doc_1',
			practiceId: 'prac_1',
			name: 'Dr. Chen',
			specialty: 'Dermatology'
		}
	]
});

describe('matchingEngine', () => {
	it('scores a complete patient against a complete practice', () => {
		const results = findMatches({
			requirements: completePatient,
			practices: [completePractice],
			availabilityByPractice: { prac_1: true }
		});
		expect(results.length).toBe(1);
		expect(results[0].score).toBeGreaterThan(0);
		expect(results[0].reasons.length).toBeGreaterThan(0);
		expect(results[0].practiceId).toBe('prac_1');
	});

	it('excludes practices not ready for matching', () => {
		const notReady = safeMerge(completePractice, {
			onboardingStatus: 'interested' as const
		});
		const results = findMatches({
			requirements: completePatient,
			practices: [notReady]
		});
		expect(results).toEqual([]);
	});

	it('excludes language mismatch', () => {
		const results = findMatches({
			requirements: completePatient,
			practices: [safeMerge(completePractice, { languages: ['German'] })]
		});
		expect(results).toEqual([]);
	});

	it('returns empty when supply pool is empty → interest path', () => {
		expect(
			findMatches({ requirements: completePatient, practices: [] })
		).toEqual([]);
	});
});

describe('match readiness via missingRequired', () => {
	it('patient ready when required fields filled', () => {
		expect(missingRequired(completePatient, MATCH_REQUIRED_PATIENT)).toEqual([]);
		expect(
			missingRequired(patientRequirementsDefaults, MATCH_REQUIRED_PATIENT).length
		).toBeGreaterThan(0);
	});

	it('practice ready when required fields filled', () => {
		expect(missingRequired(completePractice, MATCH_REQUIRED_PRACTICE)).toEqual([]);
	});
});
