import {
	aggregateDemand,
	buildInterest,
	type Interest,
	type BetaInterest,
	type InterestIntent
} from '$lib/domain/interest/interest';
import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
import { interestRepo, patientRepo } from '$lib/adapters/localRepos';
import { syncInterestRemote } from '$lib/adapters/interestApi';

export const interestService = {
	async registerInterest(input: {
		email: string;
		intent?: InterestIntent;
		betaInterest?: BetaInterest;
		practiceId?: string | null;
		requirements?: PatientRequirements;
	}): Promise<Interest> {
		const email = input.email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
			throw new Error('Invalid email');
		}
		const interest = buildInterest({
			email,
			intent: input.intent ?? 'waitlist',
			betaInterest: input.betaInterest ?? null,
			practiceId: input.practiceId ?? null,
			requirements: input.requirements ?? patientRepo.get()
		});
		interestRepo.save(interest);
		await syncInterestRemote(interest);
		return interest;
	},
	list() {
		return interestRepo.getAll();
	},
	aggregateDemand() {
		return aggregateDemand(interestRepo.getAll());
	},
	forPractice(practiceId: string) {
		return interestRepo.getAll().filter((i) => i.practiceId === practiceId);
	}
};
