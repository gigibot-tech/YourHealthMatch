import { safeMerge, missingRequired } from '$lib/safeMerge';
import { MATCH_REQUIRED_PRACTICE } from '$lib/domain/matching/matchDefaults';
import {
	practiceProfileDefaults,
	type Practice
} from '$lib/domain/practice/practiceProfileDefaults';
import {
	bookableOffers,
	buildDayTimeline,
	offerId,
	type AvailabilityOffer,
	type DayTimeline
} from '$lib/domain/scheduling/availability';
import {
	nextAvailableWithinDays,
	openSlots,
	SLOT_STEP_MINUTES,
	toISODate,
	type Slot
} from '$lib/domain/scheduling/slotCalendar';
import { timeInPreferredWindow } from '$lib/domain/scheduling/timeWindows';
import {
	CHANNEL_TO_SYSTEM,
	getSystemById,
	openUrlForSystem
} from '$lib/domain/externalSystems/catalog';
import type { AvailabilityQuery, AvailabilityStorePort } from '$lib/ports/AvailabilityStorePort';
import { availabilityStore } from '$lib/adapters/availabilityStore';
import { slotHoldStore } from '$lib/adapters/slotHoldStore';
import { appointmentRepo, practiceRepo } from '$lib/adapters/localRepos';

const DEFAULT_HOLDER = 'pat_demo';

export type PublishOfferInput = {
	practiceId: string;
	doctorId: string;
	date: string;
	time: string;
	durationMin?: number;
};

export type PracticeBookingLink = {
	id: string;
	name: string;
	href: string;
};

function addDaysIso(fromDate: string, days: number): string {
	const [y, m, d] = fromDate.split('-').map(Number);
	const date = new Date(y, m - 1, d + days);
	return toISODate(date);
}

function normalizeTime(raw: string): string {
	const match = /^(\d{1,2}):(\d{2})/.exec(raw.trim());
	if (!match) throw new Error('Use a time like 14:00');
	return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
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

function withDoctorQuery(baseUrl: string, doctorName?: string) {
	if (!doctorName?.trim()) return baseUrl;
	const q = encodeURIComponent(doctorName.trim());
	const join = baseUrl.includes('?') ? '&' : '?';
	return `${baseUrl}${join}q=${q}`;
}

export function createPracticeService(store: AvailabilityStorePort = availabilityStore) {
	return {
		list() {
			return practiceRepo.getAll();
		},

		get(id: string) {
			return practiceRepo.get(id);
		},

		listReady(): Practice[] {
			return practiceRepo.getAll().filter((p) => this.isReady(p));
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
		},

		/** Doctolib (or similar) link from the clinic record. */
		bookingLink(practiceId: string, doctorId?: string): PracticeBookingLink | null {
			const practice = practiceRepo.get(practiceId);
			if (!practice) return null;
			const doctor = doctorId
				? practice.doctors.find((d) => d.id === doctorId)
				: practice.doctors[0];
			const channelId = CHANNEL_TO_SYSTEM[practice.bookingChannel];
			if (channelId) {
				const sys = getSystemById(channelId);
				const base = practice.bookingUrl?.trim() || (sys ? openUrlForSystem(sys) : '');
				if (!sys || !base) return null;
				return {
					id: sys.id,
					name: sys.name,
					href: withDoctorQuery(base, doctor?.name)
				};
			}
			if (practice.bookingUrl?.trim()) {
				return {
					id: 'practice_custom',
					name: practice.name || 'Practice booking',
					href: withDoctorQuery(practice.bookingUrl.trim(), doctor?.name)
				};
			}
			return null;
		},

		openTimes(query?: AvailabilityQuery) {
			return store.list(query);
		},

		listBookable(input: {
			practiceId: string;
			doctorId?: string;
			fromDate: string;
			days?: number;
			preferredWindow?: string;
			holderId?: string;
		}): AvailabilityOffer[] {
			const days = input.days ?? 1;
			const toDate = days <= 1 ? input.fromDate : addDaysIso(input.fromDate, days - 1);
			const offers = store.list({
				practiceId: input.practiceId,
				doctorId: input.doctorId,
				fromDate: input.fromDate,
				toDate
			});
			const holderId = input.holderId ?? DEFAULT_HOLDER;
			const free = bookableOffers(offers, bookedSlots(input.practiceId, input.doctorId)).filter(
				(o) =>
					!slotHoldStore.isBlocked(
						{
							practiceId: o.practiceId,
							doctorId: o.doctorId,
							date: o.date,
							time: o.time
						},
						holderId
					)
			);
			if (!input.preferredWindow) return free;
			return free.filter((o) => timeInPreferredWindow(o.time, input.preferredWindow!));
		},

		/** Earliest open slot per doctor for ready clinics (matching supply). */
		nextOpenSlots(
			practices: Practice[] = this.listReady(),
			days = 28,
			preferredWindow?: string
		): Record<string, { date: string; time: string } | null> {
			const today = toISODate(new Date());
			const nextSlotByDoctor: Record<string, { date: string; time: string } | null> = {};
			for (const practice of practices) {
				for (const doctor of practice.doctors) {
					const offers = this.listBookable({
						practiceId: practice.id,
						doctorId: doctor.id,
						fromDate: today,
						days,
						preferredWindow
					});
					nextSlotByDoctor[doctor.id] = nextAvailableWithinDays(
						offers.map((o) => ({ date: o.date, time: o.time })),
						days,
						today
					);
				}
			}
			return nextSlotByDoctor;
		},

		/** Ready clinics plus each doctor's next open slot — matching supply. */
		clinicSupply(days = 28, preferredWindow?: string) {
			const practices = this.listReady();
			return {
				practices,
				nextSlotByDoctor: this.nextOpenSlots(practices, days, preferredWindow)
			};
		},

		holdSlot(input: {
			practiceId: string;
			doctorId: string;
			date: string;
			time: string;
			holderId?: string;
		}) {
			return slotHoldStore.place({
				...input,
				holderId: input.holderId ?? DEFAULT_HOLDER
			});
		},

		releaseHold(input: {
			practiceId: string;
			doctorId: string;
			date: string;
			time: string;
			holderId?: string;
		}) {
			slotHoldStore.releaseSlot({
				...input,
				holderId: input.holderId ?? DEFAULT_HOLDER
			});
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

		close(id: string) {
			const offer = store.get(id);
			if (!offer) return;
			if (bookableOffers([offer], bookedSlots(offer.practiceId, offer.doctorId)).length !== 1) {
				throw new Error('That time already has a booking. Cancel the visit first.');
			}
			store.remove(id);
		},

		dayTimeline(input: { practiceId: string; doctorId?: string; date: string }): DayTimeline {
			const offers = store.list({
				practiceId: input.practiceId,
				doctorId: input.doctorId,
				fromDate: input.date,
				toDate: input.date
			});
			const occupied = appointmentRepo
				.getAll()
				.filter(
					(a) =>
						a.practiceId === input.practiceId &&
						(!input.doctorId || a.doctorId === input.doctorId) &&
						a.date === input.date &&
						a.status !== 'cancelled' &&
						a.status !== 'rejected'
				)
				.map((a) => ({ date: a.date, time: a.time, appointmentId: a.id }));
			return buildDayTimeline(offers, occupied, input.date);
		}
	};
}

export const practiceService = createPracticeService();
