/**
 * Matching engine port — swappable (rule-based MVP → vector later).
 */
import type { MatchInput, MatchResult } from '../domain/matching/matchingEngine';
import { findMatches } from '../domain/matching/matchingEngine';

export type MatchingEnginePort = {
	findMatches(input: MatchInput): MatchResult[];
};

export const ruleBasedMatchingEngine: MatchingEnginePort = {
	findMatches
};
