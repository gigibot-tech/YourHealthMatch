import { describe, expect, it } from 'vitest';
import { bookableOffers, buildDayTimeline, offerId } from './availability';

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

	it('builds a day from published times, not a 9–1 grid', () => {
		const date = '2026-09-07';
		const timeline = buildDayTimeline(
			[
				{ date, time: '14:00' },
				{ date, time: '10:00' },
				{ date, time: '11:00' }
			],
			[{ date, time: '10:00', appointmentId: 'appt_1' }],
			date
		);
		expect(timeline.slots.map((s) => s.time)).toEqual(['10:00', '11:00', '14:00']);
		expect(timeline.slots.map((s) => s.appointmentId)).toEqual(['appt_1', null, null]);
		expect(timeline.slots.some((s) => s.time === '09:00' || s.time === '13:00')).toBe(false);
	});

	it('is empty when nothing was published that day', () => {
		const date = '2026-09-12';
		const timeline = buildDayTimeline(
			[{ date: '2026-09-07', time: '10:00' }],
			[{ date, time: '09:00', appointmentId: 'ghost' }],
			date
		);
		expect(timeline.slots).toEqual([]);
	});
});
