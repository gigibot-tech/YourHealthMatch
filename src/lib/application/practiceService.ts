import { safeMerge, missingRequired } from '$lib/safeMerge';
import { MATCH_REQUIRED_PRACTICE } from '$lib/domain/matching/matchDefaults';
import {
	practiceProfileDefaults,
	type Practice
} from '$lib/domain/practice/practiceProfileDefaults';
import { practiceRepo } from '$lib/adapters/localRepos';

export const practiceService = {
	list() {
		return practiceRepo.getAll();
	},
	get(id: string) {
		return practiceRepo.get(id);
	},
	saveProfile(id: string, patch: Partial<Practice>): Practice {
		const existing = practiceRepo.get(id) ?? safeMerge(practiceProfileDefaults, { id });
		const merged = safeMerge(practiceProfileDefaults, safeMerge(existing, patch));
		const ready = missingRequired(merged, MATCH_REQUIRED_PRACTICE).length === 0;
		if (
			ready &&
			(merged.onboardingStatus === 'onboarded' ||
				merged.onboardingStatus === 'verified' ||
				merged.onboardingStatus === 'available_for_matching')
		) {
			merged.onboardingStatus = 'available_for_matching';
		}
		return practiceRepo.save(merged);
	},
	isReady(practice: Practice) {
		return (
			practice.onboardingStatus === 'available_for_matching' &&
			missingRequired(practice, MATCH_REQUIRED_PRACTICE).length === 0
		);
	}
};
