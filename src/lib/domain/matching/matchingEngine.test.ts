import { describe, expect, it } from 'vitest';
import { safeMerge } from '$lib/safeMerge';
import {
	MATCH_REQUIRED_PATIENT,
	MATCH_REQUIRED_PRACTICE,
	MATCH_RESULT_MAX,
	patientRequirementsDefaults,
	practiceProfileDefaults
} from './matchDefaults';
import { findMatches, scoreDoctor } from './matchingEngine';
import { missingRequired } from '$lib/safeMerge';
import type { Practice } from '../practice/practiceProfileDefaults';
import {
	insuranceAcceptedByPractice,
	passesProximityRule,
	proximityTier,
	specialtyMatchesDoctor
} from './matchRules';
import { normalizeLanguageCode, practiceSpeaksLanguage } from '../languages';

const nextSlot = { date: '2030-06-10', time: '10:00' };

const completePatient = safeMerge(patientRequirementsDefaults, {
	language: 'AR',
	specialty: 'Dermatology',
	insurance: 'GKV' as const,
	location: 'Greifswald',
	newPatient: true,
	modality: 'either' as const,
	postcode: '17489',
	krankenkasse: 'TK',
	city: 'Greifswald'
});

const completePractice: Practice = safeMerge(practiceProfileDefaults, {
	id: 'prac_1',
	name: 'Hautarztpraxis Nord',
	languages: ['AR', 'DE', 'EN'],
	specialties: ['Dermatology', 'General Practitioner'],
	insuranceAccepted: ['GKV', 'PKV'],
	kvApproved: true,
	location: 'Greifswald',
	postcode: '17489',
	acceptingNewPatients: true,
	onboardingStatus: 'available_for_matching' as const,
	modalities: ['in_person', 'video'],
	bookingChannel: 'direct' as const,
	doctors: [
		{
			id: 'doc_1',
			practiceId: 'prac_1',
			name: 'Dr. Chen',
			specialty: 'Dermatology',
			videoEnabled: true
		}
	]
});

function slotsFor(...doctorIds: string[]) {
	const map: Record<string, typeof nextSlot | null> = {};
	for (const id of doctorIds) map[id] = nextSlot;
	return map;
}

describe('matchLanguages', () => {
	it('maps labels and codes to Phase-1 ISO codes (UK = Ukrainian)', () => {
		expect(normalizeLanguageCode('English')).toBe('EN');
		expect(normalizeLanguageCode('Deutsch')).toBe('DE');
		expect(normalizeLanguageCode('uk')).toBe('UK');
		expect(normalizeLanguageCode('Ukrainian')).toBe('UK');
		expect(practiceSpeaksLanguage(['EN', 'DE'], 'English')).toBe(true);
		expect(practiceSpeaksLanguage(['German'], 'DE')).toBe(true);
	});
});

describe('matchRules', () => {
	it('rejects GKV without KV-Zulassung', () => {
		expect(
			insuranceAcceptedByPractice(
				safeMerge(completePractice, { kvApproved: false }),
				'GKV'
			)
		).toBe(false);
		expect(insuranceAcceptedByPractice(completePractice, 'GKV')).toBe(true);
	});

	it('accepts PKV and Selbstzahler when listed', () => {
		expect(insuranceAcceptedByPractice(completePractice, 'PKV')).toBe(true);
		expect(
			insuranceAcceptedByPractice(
				safeMerge(completePractice, { insuranceAccepted: ['self_pay'] }),
				'self_pay'
			)
		).toBe(true);
		expect(
			insuranceAcceptedByPractice(
				safeMerge(completePractice, { insuranceAccepted: ['private'] }),
				'private'
			)
		).toBe(true);
	});

	it('requires proximity for in_person and skips it for video', () => {
		const far = safeMerge(completePractice, { location: 'Berlin', postcode: '10115' });
		expect(
			passesProximityRule(safeMerge(completePatient, { modality: 'in_person' }), far)
		).toBe(false);
		expect(passesProximityRule(safeMerge(completePatient, { modality: 'video' }), far)).toBe(
			true
		);
		expect(passesProximityRule(safeMerge(completePatient, { modality: 'either' }), far)).toBe(
			true
		);
	});

	it('accepts in-person via km radius when PLZ and city differ but coords are near', () => {
		const neighbour = safeMerge(completePractice, {
			location: 'Wiek',
			postcode: '18507',
			lat: 54.31,
			lng: 13.09
		});
		expect(
			passesProximityRule(safeMerge(completePatient, { modality: 'in_person' }), neighbour)
		).toBe(true);
		expect(
			proximityTier(safeMerge(completePatient, { modality: 'in_person' }), neighbour)
		).toBe('radius');
	});

	it('matches specialty on the doctor', () => {
		expect(specialtyMatchesDoctor(completePractice.doctors[0], 'Dermatology')).toBe(true);
		expect(specialtyMatchesDoctor(completePractice.doctors[0], 'Ophthalmology')).toBe(false);
	});
});

describe('matchingEngine', () => {
	it('matches a ready doctor with a published slot', () => {
		const results = findMatches({
			requirements: completePatient,
			practices: [completePractice],
			nextSlotByDoctor: slotsFor('doc_1')
		});
		expect(results).toHaveLength(1);
		expect(results[0].doctorId).toBe('doc_1');
		expect(results[0].reasons.length).toBeGreaterThan(0);
		expect(results[0].nextSlot).toEqual(nextSlot);
	});

	it('excludes practices not ready for matching', () => {
		const notReady = safeMerge(completePractice, {
			onboardingStatus: 'interested' as const
		});
		expect(
			findMatches({
				requirements: completePatient,
				practices: [notReady],
				nextSlotByDoctor: slotsFor('doc_1')
			})
		).toEqual([]);
	});

	it('excludes language mismatch', () => {
		expect(
			findMatches({
				requirements: completePatient,
				practices: [safeMerge(completePractice, { languages: ['DE'] })],
				nextSlotByDoctor: slotsFor('doc_1')
			})
		).toEqual([]);
	});

	it('excludes wrong specialty on the doctor', () => {
		const practice = safeMerge(completePractice, {
			doctors: [
				{
					id: 'doc_1',
					practiceId: 'prac_1',
					name: 'Dr. Chen',
					specialty: 'Cardiologist'
				}
			]
		});
		expect(
			findMatches({
				requirements: completePatient,
				practices: [practice],
				nextSlotByDoctor: slotsFor('doc_1')
			})
		).toEqual([]);
	});

	it('excludes GKV when practice lacks KV approval', () => {
		expect(
			findMatches({
				requirements: completePatient,
				practices: [safeMerge(completePractice, { kvApproved: false })],
				nextSlotByDoctor: slotsFor('doc_1')
			})
		).toEqual([]);
	});

	it('excludes doctors with no published slot', () => {
		expect(
			findMatches({
				requirements: completePatient,
				practices: [completePractice],
				nextSlotByDoctor: { doc_1: null }
			})
		).toEqual([]);
	});

	it('excludes far in-person visits and keeps far video visits', () => {
		const far = safeMerge(completePractice, { location: 'Munich', postcode: '80331' });
		expect(
			findMatches({
				requirements: safeMerge(completePatient, { modality: 'in_person' }),
				practices: [far],
				nextSlotByDoctor: slotsFor('doc_1')
			})
		).toEqual([]);
		expect(
			findMatches({
				requirements: safeMerge(completePatient, { modality: 'video' }),
				practices: [far],
				nextSlotByDoctor: slotsFor('doc_1')
			})
		).toHaveLength(1);
	});

	it('drops a video request when that doctor is not enabled', () => {
		const disabled = safeMerge(completePractice, {
			doctors: completePractice.doctors.map((d) => ({ ...d, videoEnabled: false }))
		});
		expect(
			findMatches({
				requirements: safeMerge(completePatient, { modality: 'video' }),
				practices: [disabled],
				nextSlotByDoctor: slotsFor('doc_1')
			})
		).toEqual([]);
	});

	it('returns one result per matching doctor at the same practice', () => {
		const practice = safeMerge(completePractice, {
			specialties: ['Dermatology'],
			doctors: [
				{
					id: 'doc_a',
					practiceId: 'prac_1',
					name: 'Dr. A',
					specialty: 'Dermatology'
				},
				{
					id: 'doc_b',
					practiceId: 'prac_1',
					name: 'Dr. B',
					specialty: 'Dermatology'
				}
			]
		});
		const results = findMatches({
			requirements: completePatient,
			practices: [practice],
			nextSlotByDoctor: slotsFor('doc_a', 'doc_b')
		});
		expect(results.map((r) => r.doctorId).sort()).toEqual(['doc_a', 'doc_b']);
	});

	it(`caps results at ${MATCH_RESULT_MAX} doctors`, () => {
		const doctors = Array.from({ length: 6 }, (_, i) => ({
			id: `doc_${i}`,
			practiceId: 'prac_1',
			name: `Dr. ${i}`,
			specialty: 'Dermatology'
		}));
		const practice = safeMerge(completePractice, { doctors });
		const results = findMatches({
			requirements: completePatient,
			practices: [practice],
			nextSlotByDoctor: slotsFor(...doctors.map((d) => d.id))
		});
		expect(results).toHaveLength(MATCH_RESULT_MAX);
	});

	it('returns empty when supply pool is empty → interest path', () => {
		expect(findMatches({ requirements: completePatient, practices: [] })).toEqual([]);
	});

	it('scoreDoctor returns null without a next slot', () => {
		expect(scoreDoctor(completePatient, completePractice, completePractice.doctors[0], null)).toBeNull();
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
