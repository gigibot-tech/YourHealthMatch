import { safeMerge, missingRequired } from '$lib/safeMerge';
import {
	MATCH_REQUIRED_PATIENT,
	MATCH_REQUIRED_PRACTICE,
	patientRequirementsDefaults,
	type PatientRequirements
} from '$lib/domain/matching/matchDefaults';
import type { MatchResult } from '$lib/domain/matching/matchingEngine';
import { nextAvailableWithinDays, toISODate } from '$lib/domain/scheduling/slotCalendar';
import { patientRepo, practiceRepo } from '$lib/adapters/localRepos';
import {
	ruleBasedMatchingEngine,
	type MatchingEnginePort
} from '$lib/ports/MatchingEnginePort';
import { availabilityService } from './availabilityService';

export type MatchingServiceDeps = {
	engine: MatchingEnginePort;
};

export function createMatchingService(deps: Partial<MatchingServiceDeps> = {}) {
	const engine = deps.engine ?? ruleBasedMatchingEngine;

	return {
		findMatches(requirements?: PatientRequirements): MatchResult[] {
			const reqs = safeMerge(patientRequirementsDefaults, requirements ?? patientRepo.get());
			if (missingRequired(reqs, MATCH_REQUIRED_PATIENT).length > 0) return [];

			const practices = practiceRepo
				.getAll()
				.filter(
					(p) =>
						p.onboardingStatus === 'available_for_matching' &&
						missingRequired(p, MATCH_REQUIRED_PRACTICE).length === 0
				);

			const today = toISODate(new Date());
			const nextSlotByDoctor: Record<string, { date: string; time: string } | null> = {};
			for (const practice of practices) {
				for (const doctor of practice.doctors) {
					const offers = availabilityService.listBookable({
						practiceId: practice.id,
						doctorId: doctor.id,
						fromDate: today,
						days: 28
					});
					nextSlotByDoctor[doctor.id] = nextAvailableWithinDays(
						offers.map((o) => ({ date: o.date, time: o.time })),
						28,
						today
					);
				}
			}

			return engine.findMatches({ requirements: reqs, practices, nextSlotByDoctor });
		},

		isPatientReady(reqs?: PatientRequirements) {
			const r = safeMerge(patientRequirementsDefaults, reqs ?? patientRepo.get());
			return missingRequired(r, MATCH_REQUIRED_PATIENT);
		}
	};
}

export const matchingService = createMatchingService();
