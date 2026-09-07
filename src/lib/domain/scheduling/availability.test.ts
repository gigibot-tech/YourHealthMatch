import { describe, expect, it } from 'vitest';
import { bookableOffers, offerId } from './availability';

describe('availability offers', () => {
	it('builds a stable id per doctor/time', () => {
		expect(
			offerId({
				practiceId: 'prac_turner',
				doctorId: 'doc_turner',
				date: '2026-09-08',
				time: '10:00'
			})
		).toBe('off_prac_turner_doc_turner_2026-09-08_10:00');
	});

	it('hides times that are already booked', () => {
		const offers = [
			{
				id: 'a',
				practiceId: 'p',
				doctorId: 'd',
				date: '2026-09-08',
				time: '10:00',
				durationMin: 30
			},
			{
				id: 'b',
				practiceId: 'p',
				doctorId: 'd',
				date: '2026-09-08',
				time: '11:00',
				durationMin: 30
			}
		];
		expect(bookableOffers(offers, [{ date: '2026-09-08', time: '10:00' }]).map((o) => o.time)).toEqual([
			'11:00'
		]);
	});
});
