import { offerId, type AvailabilityOffer } from '$lib/domain/scheduling/availability';
import { SLOT_STEP_MINUTES, toISODate } from '$lib/domain/scheduling/slotCalendar';
import {
	matchesAvailabilityQuery,
	type AvailabilityQuery,
	type AvailabilityStorePort
} from '$lib/ports/AvailabilityStorePort';
import { createLocalRepo } from './localRepos';

function addDaysISO(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return toISODate(d);
}

function isWeekday(iso: string): boolean {
	const [y, m, day] = iso.split('-').map(Number);
	const dow = new Date(y, m - 1, day).getDay();
	return dow !== 0 && dow !== 6;
}

function seedOffers(): AvailabilityOffer[] {
	const out: AvailabilityOffer[] = [];
	const add = (practiceId: string, doctorId: string, date: string, times: string[]) => {
		for (const time of times) {
			out.push({
				id: offerId({ practiceId, doctorId, date, time }),
				practiceId,
				doctorId,
				date,
				time,
				durationMin: SLOT_STEP_MINUTES
			});
		}
	};
	for (let i = 0; i < 7; i++) {
		const date = addDaysISO(i);
		if (!isWeekday(date)) continue;
		add('prac_turner', 'doc_turner', date, ['10:00', '11:00', '14:00']);
		add('prac_turner', 'doc_chen', date, ['14:30']);
	}
	add('prac_davis', 'doc_davis', addDaysISO(2), ['09:00']);
	return out;
}

const repo = createLocalRepo<AvailabilityOffer>('yhm_availability_v1', seedOffers, {
	reseedIfEmpty: true
});

/** Default store. Swap this export for a Postgres/HTTP implementation of the same port. */
export const availabilityStore: AvailabilityStorePort = {
	list(query?: AvailabilityQuery) {
		return repo.getAll().filter((offer) => matchesAvailabilityQuery(offer, query));
	},
	get(id) {
		return repo.get(id);
	},
	save(offer) {
		return repo.save(offer);
	},
	remove(id) {
		repo.remove(id);
	},
	replaceAll(items) {
		repo.replaceAll(items);
	},
	subscribe(listener) {
		return repo.subscribe(listener);
	}
};
