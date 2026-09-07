/**
 * Interest / waitlist domain + service helpers (survey Q21f/Q24).
 * Kept together — defaults + aggregate are <100 LoC and one bounded context.
 */
import { safeMerge } from '$lib/safeMerge';
import {
	patientRequirementsDefaults,
	type PatientRequirements
} from '../matching/matchDefaults';

export type InterestIntent = 'waitlist' | 'beta' | 'notify_match';
export type BetaInterest = 'yes' | 'maybe' | 'no' | null;

export type Interest = {
	id: string;
	email: string;
	requirements: PatientRequirements;
	practiceId: string | null;
	intent: InterestIntent;
	betaInterest: BetaInterest;
	createdAt: string;
	notifiedAt: string | null;
};

export const interestDefaults: Interest = {
	id: '',
	email: '',
	requirements: { ...patientRequirementsDefaults },
	practiceId: null,
	intent: 'waitlist',
	betaInterest: null,
	createdAt: '',
	notifiedAt: null
};

export type DemandBucket = {
	specialty: string;
	language: string;
	location: string;
	count: number;
};

export function buildInterest(patch: Partial<Interest>, now = new Date()): Interest {
	const base = safeMerge(interestDefaults, {
		id: `int_${now.getTime()}`,
		createdAt: now.toISOString()
	});
	const merged = safeMerge(base, patch);
	merged.requirements = safeMerge(
		patientRequirementsDefaults,
		patch.requirements ?? merged.requirements
	);
	return merged;
}

export function aggregateDemand(interests: Interest[]): DemandBucket[] {
	const map = new Map<string, DemandBucket>();
	for (const i of interests) {
		const specialty = i.requirements.specialty || 'any';
		const language = i.requirements.language || 'any';
		const location = i.requirements.location || i.requirements.city || 'any';
		const key = `${specialty}|${language}|${location}`;
		const cur = map.get(key) ?? { specialty, language, location, count: 0 };
		cur.count += 1;
		map.set(key, cur);
	}
	return [...map.values()].sort((a, b) => b.count - a.count);
}
