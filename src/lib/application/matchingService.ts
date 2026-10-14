import { safeMerge, missingRequired } from '$lib/safeMerge';
import {
	MATCH_REQUIRED_PATIENT,
	patientRequirementsDefaults,
	type PatientRequirements
} from '$lib/domain/matching/matchDefaults';
import type { MatchResult } from '$lib/domain/matching/matchingEngine';
import type { Practice } from '$lib/domain/practice/practiceProfileDefaults';
import {
	ruleBasedMatchingEngine,
	type MatchingEnginePort
} from '$lib/ports/MatchingEnginePort';
import { patientRepo } from '$lib/adapters/localRepos';

/** Clinic side of a match query: ready practices and each doctor's next open slot. */
export type ClinicSupply = {
	practices: Practice[];
	nextSlotByDoctor: Record<string, { date: string; time: string } | null>;
};

export type FindMatchesInput = {
	patient: PatientRequirements;
	supply: ClinicSupply;
};

export type MatchingServiceDeps = {
	engine: MatchingEnginePort;
};

/**
 * Pure matching query. Callers load supply (careRecommendations for the match UI).
 */
export function createMatchingService(deps: Partial<MatchingServiceDeps> = {}) {
	const engine = deps.engine ?? ruleBasedMatchingEngine;

	return {
		findMatches(input: FindMatchesInput): MatchResult[] {
			const reqs = safeMerge(patientRequirementsDefaults, input.patient);
			if (missingRequired(reqs, MATCH_REQUIRED_PATIENT).length > 0) return [];
			return engine.findMatches({
				requirements: reqs,
				practices: input.supply.practices,
				nextSlotByDoctor: input.supply.nextSlotByDoctor
			});
		},

		isPatientReady(reqs?: PatientRequirements) {
			const r = safeMerge(patientRequirementsDefaults, reqs ?? patientRepo.get());
			return missingRequired(r, MATCH_REQUIRED_PATIENT);
		}
	};
}

export const matchingService = createMatchingService();
