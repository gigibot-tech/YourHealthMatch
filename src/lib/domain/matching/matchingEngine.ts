import {
	MATCH_REQUIRED_PRACTICE,
	MATCH_WEIGHTS,
	type PatientRequirements
} from './matchDefaults';
import type { Practice } from '../practice/practiceProfileDefaults';
import { missingRequired } from '$lib/safeMerge';

export type MatchResult = {
	practiceId: string;
	doctorId?: string;
	score: number;
	reasons: string[];
};

export type MatchInput = {
	requirements: PatientRequirements;
	practices: Practice[];
	/** practiceId → has same-week availability */
	availabilityByPractice?: Record<string, boolean>;
};

function includesCI(list: string[], value: string): boolean {
	const v = value.trim().toLowerCase();
	if (!v) return false;
	return list.some((x) => x.toLowerCase() === v || x.toLowerCase().includes(v));
}

function locationMatch(req: PatientRequirements, practice: Practice): boolean {
	const loc = (req.location || req.city || '').trim().toLowerCase();
	if (!loc) return false;
	const pLoc = practice.location.toLowerCase();
	const pPlz = practice.postcode.toLowerCase();
	const reqPlz = (req.postcode || '').trim().toLowerCase();
	if (reqPlz && pPlz && reqPlz === pPlz) return true;
	return pLoc.includes(loc) || loc.includes(pLoc);
}

export function scorePractice(
	requirements: PatientRequirements,
	practice: Practice,
	hasAvailability: boolean
): MatchResult | null {
	if (practice.onboardingStatus !== 'available_for_matching') return null;
	if (missingRequired(practice, MATCH_REQUIRED_PRACTICE).length > 0) return null;

	let score = 0;
	const reasons: string[] = [];

	if (includesCI(practice.languages, requirements.language)) {
		score += MATCH_WEIGHTS.language;
		reasons.push(`Speaks ${requirements.language}`);
	} else {
		return null; // hard filter: language
	}

	if (includesCI(practice.specialties, requirements.specialty)) {
		score += MATCH_WEIGHTS.specialty;
		reasons.push(`${requirements.specialty} offered`);
	} else {
		return null; // hard filter: specialty
	}

	if (
		requirements.insurance &&
		includesCI(practice.insuranceAccepted, requirements.insurance)
	) {
		score += MATCH_WEIGHTS.insurance;
		reasons.push(`Accepts ${requirements.insurance}`);
	} else if (requirements.insurance) {
		return null; // hard filter: insurance type
	}

	if (locationMatch(requirements, practice)) {
		score += MATCH_WEIGHTS.location;
		reasons.push(`Near ${requirements.location || requirements.city}`);
	}

	if (requirements.newPatient === true) {
		if (practice.acceptingNewPatients === true) {
			score += MATCH_WEIGHTS.newPatient;
			reasons.push('Accepting new patients');
		} else {
			return null;
		}
	} else if (requirements.newPatient === false) {
		score += MATCH_WEIGHTS.newPatient;
	}

	if (hasAvailability) {
		score += MATCH_WEIGHTS.availability;
		reasons.push('Same-week availability');
	}

	const doctor =
		practice.doctors.find((d) =>
			includesCI([d.specialty], requirements.specialty)
		) ?? practice.doctors[0];

	return {
		practiceId: practice.id,
		doctorId: doctor?.id,
		score,
		reasons
	};
}

export function findMatches(input: MatchInput): MatchResult[] {
	const { requirements, practices, availabilityByPractice = {} } = input;
	const results: MatchResult[] = [];
	for (const practice of practices) {
		const scored = scorePractice(
			requirements,
			practice,
			Boolean(availabilityByPractice[practice.id])
		);
		if (scored) results.push(scored);
	}
	return results.sort((a, b) => b.score - a.score);
}
