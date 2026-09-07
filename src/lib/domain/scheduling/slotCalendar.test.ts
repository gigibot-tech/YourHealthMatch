import { describe, expect, it } from 'vitest';
import {
	dateStrip,
	hasClash,
	nextAvailableWithinDays,
	openSlots,
	toISODate
} from './slotCalendar';

describe('slotCalendar', () => {
	it('builds a date strip of N days', () => {
		const strip = dateStrip(7, { now: () => new Date('2026-09-07T12:00:00') });
		expect(strip).toHaveLength(7);
		expect(strip[0].iso).toBe('2026-09-07');
	});

	it('opens slots from weekly hours excluding booked', () => {
		const from = '2026-09-07'; // Monday
		const slots = openSlots({
			weeklyHours: { mon: ['09:00', '10:00'], tue: null },
			booked: [{ date: from, time: '09:00' }],
			fromDate: from,
			days: 1
		});
		expect(slots.map((s) => s.time)).toEqual(['09:30']);
	});

	it('detects clashes', () => {
		expect(hasClash({ date: '2026-09-07', time: '10:00' }, [{ date: '2026-09-07', time: '10:00' }])).toBe(
			true
		);
	});

	it('finds next available within days', () => {
		const slots = [
			{ date: '2026-09-10', time: '09:00' },
			{ date: '2026-09-20', time: '09:00' }
		];
		expect(nextAvailableWithinDays(slots, 7, '2026-09-07')?.date).toBe('2026-09-10');
		expect(nextAvailableWithinDays(slots, 2, '2026-09-07')).toBeNull();
	});

	it('toISODate uses local calendar', () => {
		expect(toISODate(new Date(2026, 8, 7))).toBe('2026-09-07');
	});
});
