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
