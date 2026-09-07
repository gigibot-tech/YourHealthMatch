import { bookableOffers, offerId, type AvailabilityOffer } from '$lib/domain/scheduling/availability';
import { openSlots, SLOT_STEP_MINUTES, toISODate, type Slot } from '$lib/domain/scheduling/slotCalendar';
import type { Practice } from '$lib/domain/practice/practiceProfileDefaults';
import type { AvailabilityQuery, AvailabilityStorePort } from '$lib/ports/AvailabilityStorePort';
import { availabilityStore } from '$lib/adapters/availabilityStore';
import { appointmentRepo } from '$lib/adapters/localRepos';

function addDaysIso(fromDate: string, days: number): string {
	const [y, m, d] = fromDate.split('-').map(Number);
	const date = new Date(y, m - 1, d + days);
	return toISODate(date);
}

function bookedSlots(practiceId: string, doctorId?: string): Slot[] {
	return appointmentRepo
		.getAll()
		.filter(
			(a) =>
				a.practiceId === practiceId &&
				(!doctorId || a.doctorId === doctorId) &&
				a.status !== 'cancelled' &&
				a.status !== 'rejected'
		)
		.map((a) => ({ date: a.date, time: a.time }));
}

export type PublishOfferInput = {
	practiceId: string;
	doctorId: string;
	date: string;
	time: string;
	durationMin?: number;
};

function normalizeTime(raw: string): string {
	const match = /^(\d{1,2}):(\d{2})/.exec(raw.trim());
	if (!match) throw new Error('Use a time like 14:00');
	return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

export function createAvailabilityService(store: AvailabilityStorePort = availabilityStore) {
	return {
		listPublished(query?: AvailabilityQuery) {
			return store.list(query);
		},

		listBookable(input: {
			practiceId: string;
			doctorId?: string;
			fromDate: string;
			days?: number;
		}): AvailabilityOffer[] {
			const days = input.days ?? 1;
			const toDate = days <= 1 ? input.fromDate : addDaysIso(input.fromDate, days - 1);
			const offers = store.list({
				practiceId: input.practiceId,
				doctorId: input.doctorId,
				fromDate: input.fromDate,
				toDate
			});
			return bookableOffers(offers, bookedSlots(input.practiceId, input.doctorId));
		},

		publish(input: PublishOfferInput): AvailabilityOffer {
			const time = normalizeTime(input.time);
			const offer: AvailabilityOffer = {
				id: offerId({
					practiceId: input.practiceId,
					doctorId: input.doctorId,
					date: input.date,
					time
				}),
				practiceId: input.practiceId,
				doctorId: input.doctorId,
				date: input.date,
				time,
				durationMin: input.durationMin ?? SLOT_STEP_MINUTES
			};
			return store.save(offer);
		},

		publishFromWeeklyHours(practice: Practice, doctorId: string, date: string): AvailabilityOffer[] {
			const generated = openSlots({
				weeklyHours: practice.weeklyHours,
				booked: [],
				fromDate: date,
				days: 1
			});
			return generated.map((slot) =>
				this.publish({
					practiceId: practice.id,
					doctorId,
					date: slot.date,
					time: slot.time
				})
			);
		},

		unpublish(id: string) {
			const offer = store.get(id);
			if (!offer) return;
			if (!isSlotAvailableForUnpublish(offer)) {
				throw new Error('That time already has a booking. Cancel the visit first.');
			}
			store.remove(id);
		}
	};
}

function isSlotAvailableForUnpublish(offer: AvailabilityOffer): boolean {
	return bookableOffers([offer], bookedSlots(offer.practiceId, offer.doctorId)).length === 1;
}

export const availabilityService = createAvailabilityService();
