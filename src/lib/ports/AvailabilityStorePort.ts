import type { AvailabilityOffer } from '../domain/scheduling/availability';

export type AvailabilityQuery = {
	practiceId?: string;
	doctorId?: string;
	fromDate?: string;
	toDate?: string;
};

/**
 * Availability persistence port — swap localStorage for Postgres/HTTP without touching domain or UI.
 * Canonical table: src/lib/adapters/availability.schema.sql
 */
export type AvailabilityStorePort = {
	list(query?: AvailabilityQuery): AvailabilityOffer[];
	get(id: string): AvailabilityOffer | null;
	save(offer: AvailabilityOffer): AvailabilityOffer;
	remove(id: string): void;
	replaceAll(items: AvailabilityOffer[]): void;
	subscribe(listener: (all: AvailabilityOffer[]) => void): () => void;
};

export function matchesAvailabilityQuery(
	offer: AvailabilityOffer,
	query?: AvailabilityQuery
): boolean {
	if (!query) return true;
	if (query.practiceId && offer.practiceId !== query.practiceId) return false;
	if (query.doctorId && offer.doctorId !== query.doctorId) return false;
	if (query.fromDate && offer.date < query.fromDate) return false;
	if (query.toDate && offer.date > query.toDate) return false;
	return true;
}
