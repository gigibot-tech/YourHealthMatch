import { isSlotAvailable, type Slot } from './slotCalendar';

/** Doctor-published bookable time. Patients never invent slots. */
export type AvailabilityOffer = {
	id: string;
	practiceId: string;
	doctorId: string;
	date: string;
	time: string;
	durationMin: number;
};

export function offerId(input: {
	practiceId: string;
	doctorId: string;
	date: string;
	time: string;
}): string {
	return `off_${input.practiceId}_${input.doctorId}_${input.date}_${input.time}`;
}

export function toSlot(offer: AvailabilityOffer): Slot {
	return { date: offer.date, time: offer.time };
}

export function bookableOffers(offers: AvailabilityOffer[], booked: Slot[]): AvailabilityOffer[] {
	return offers.filter((offer) => isSlotAvailable(toSlot(offer), booked));
}

/** One published hour on a day — open, or held by a visit. */
export type DayTimelineSlot = {
	time: string;
	appointmentId: string | null;
};

export type DayTimeline = {
	date: string;
	slots: DayTimelineSlot[];
};

/**
 * Day view is published offers, not a fake clinic grid.
 * Occupied times that were never opened do not appear.
 */
export function buildDayTimeline(
	offers: Pick<AvailabilityOffer, 'date' | 'time'>[],
	occupied: { date: string; time: string; appointmentId: string }[],
	date: string
): DayTimeline {
	const times = [
		...new Set(offers.filter((offer) => offer.date === date).map((offer) => offer.time))
	].sort();
	const byTime = new Map<string, string>();
	for (const row of occupied) {
		if (row.date !== date) continue;
		if (!byTime.has(row.time)) byTime.set(row.time, row.appointmentId);
	}
	return {
		date,
		slots: times.map((time) => ({
			time,
			appointmentId: byTime.get(time) ?? null
		}))
	};
}
