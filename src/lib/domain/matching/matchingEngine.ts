/**
 * Deterministic Phase-1 matching: five hard rules, then cap at MATCH_RESULT_MAX doctors.
 * No learned weights — application supplies practices and per-doctor next slots.
 */
import { missingRequired } from '$lib/safeMerge';
import type { Doctor, Practice } from '../practice/practiceProfileDefaults';
import {
	MATCH_REQUIRED_PRACTICE,
	MATCH_RESULT_MAX,
	type PatientRequirements
} from './matchDefaults';
import { practiceSpeaksLanguage } from './matchLanguages';
import {
	acceptsNewPatientsWhenRequired,
	compareNextSlot,
	compareProximity,
	doctorHasNextSlot,
	insuranceAcceptedByPractice,
	insuranceReason,
	languageReason,
	passesProximityRule,
	proximityReason,
	proximityTier,
	specialtyMatchesDoctor,
	specialtyReason,
	type NextSlot,
	type ProximityTier
} from './matchRules';

export type MatchResult = {
	practiceId: string;
	doctorId: string;
	/** Kept for booking draft; ranking uses next slot + proximity, not percent fit. */
	score: number;
	reasons: string[];
	nextSlot?: NextSlot;
	proximityTier?: ProximityTier;
};

export type MatchInput = {
	requirements: PatientRequirements;
	practices: Practice[];
	/** doctorId → earliest published bookable slot (calendar / availability store). */
	nextSlotByDoctor?: Record<string, NextSlot | null>;
};

function practiceReady(practice: Practice): boolean {
	return (
		practice.onboardingStatus === 'available_for_matching' &&
		missingRequired(practice, MATCH_REQUIRED_PRACTICE).length === 0
	);
}

function evaluateDoctor(
	requirements: PatientRequirements,
	practice: Practice,
	doctor: Doctor,
	nextSlot: NextSlot | null | undefined
): MatchResult | null {
	if (!practiceReady(practice)) return null;
	if (!acceptsNewPatientsWhenRequired(requirements, practice)) return null;

	// (1) Patient language
	if (!practiceSpeaksLanguage(practice.languages, requirements.language)) return null;

	// (2) Specialty on this doctor
	if (!specialtyMatchesDoctor(doctor, requirements.specialty)) return null;

	// (3) Insurance (GKV → KV approval)
	if (!insuranceAcceptedByPractice(practice, requirements.insurance)) return null;

	// (4) Availability (published calendar slot for this doctor)
	if (!doctorHasNextSlot(nextSlot)) return null;

	// (5) Geographic proximity for offline mediation
	if (!passesProximityRule(requirements, practice)) return null;

	const tier = proximityTier(requirements, practice);
	const reasons = [
		languageReason(requirements.language),
		specialtyReason(requirements.specialty),
		insuranceReason(requirements.insurance)
	];
	if (requirements.newPatient === true) reasons.push('Taking new patients');
	const near = proximityReason(requirements, tier);
	if (near) reasons.push(near);

	return {
		practiceId: practice.id,
		doctorId: doctor.id,
		score: reasons.length,
		reasons,
		nextSlot,
		proximityTier: tier
	};
}

function sortMatches(a: MatchResult, b: MatchResult): number {
	if (a.nextSlot && b.nextSlot) {
		const bySlot = compareNextSlot(a.nextSlot, b.nextSlot);
		if (bySlot !== 0) return bySlot;
	}
	const byProx = compareProximity(a.proximityTier ?? 'none', b.proximityTier ?? 'none');
	if (byProx !== 0) return byProx;
	return a.doctorId.localeCompare(b.doctorId);
}

/** Evaluate one doctor against the five rules (plus new-patient when required). */
export function scoreDoctor(
	requirements: PatientRequirements,
	practice: Practice,
	doctor: Doctor,
	nextSlot: NextSlot | null | undefined
): MatchResult | null {
	return evaluateDoctor(requirements, practice, doctor, nextSlot);
}

export function findMatches(input: MatchInput): MatchResult[] {
	const { requirements, practices, nextSlotByDoctor = {} } = input;
	const results: MatchResult[] = [];

	for (const practice of practices) {
		for (const doctor of practice.doctors) {
			const scored = evaluateDoctor(
				requirements,
				practice,
				doctor,
				nextSlotByDoctor[doctor.id] ?? null
			);
			if (scored) results.push(scored);
		}
	}

	return results.sort(sortMatches).slice(0, MATCH_RESULT_MAX);
}
