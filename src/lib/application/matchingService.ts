import { safeMerge, missingRequired } from '$lib/safeMerge';
import {
	MATCH_REQUIRED_PATIENT,
	MATCH_REQUIRED_PRACTICE,
	patientRequirementsDefaults,
	type PatientRequirements
} from '$lib/domain/matching/matchDefaults';
import { findMatches, type MatchResult } from '$lib/domain/matching/matchingEngine';
import {
	nextAvailableWithinDays,
	openSlots,
	toISODate
} from '$lib/domain/scheduling/slotCalendar';
import { appointmentRepo, patientRepo, practiceRepo } from '$lib/adapters/localRepos';

function bookedSlots(practiceId: string) {
	return appointmentRepo
		.getAll()
		.filter((a) => a.practiceId === practiceId && a.status !== 'cancelled' && a.status !== 'rejected')
		.map((a) => ({ date: a.date, time: a.time }));
}

export const matchingService = {
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
		const availabilityByPractice: Record<string, boolean> = {};
		for (const p of practices) {
			const slots = openSlots({
				weeklyHours: p.weeklyHours,
				explicitSlots: p.availabilitySlots,
				booked: bookedSlots(p.id),
				fromDate: today,
				days: 7
			});
			availabilityByPractice[p.id] = Boolean(nextAvailableWithinDays(slots, 7, today));
		}

		return findMatches({ requirements: reqs, practices, availabilityByPractice });
	},

	isPatientReady(reqs?: PatientRequirements) {
		const r = safeMerge(patientRequirementsDefaults, reqs ?? patientRepo.get());
		return missingRequired(r, MATCH_REQUIRED_PATIENT);
	}
};
