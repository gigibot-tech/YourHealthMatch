import { describe, expect, it } from 'vitest';
import {
	dateStrip,
	hasClash,
	monthGrid,
	nextAvailableWithinDays,
	openSlots,
	shiftMonth,
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

	it('builds a Monday-first month grid like a flight-date picker', () => {
		const grid = monthGrid(2026, 10, { now: () => new Date('2026-10-02T12:00:00') });
		expect(grid.title).toBe('October 2026');
		expect(grid.cells).toHaveLength(42);
		// 1 Oct 2026 is Thursday → Monday-first grid starts Mon 28 Sep
		expect(grid.cells[0].iso).toBe('2026-09-28');
		expect(grid.cells[0].inMonth).toBe(false);
		const firstOfMonth = grid.cells.find((c) => c.iso === '2026-10-01');
		expect(firstOfMonth?.inMonth).toBe(true);
		expect(grid.cells.find((c) => c.iso === '2026-10-01')?.past).toBe(true);
		expect(grid.cells.find((c) => c.iso === '2026-10-02')?.past).toBe(false);
		expect(grid.cells.find((c) => c.iso === '2026-09-30')?.past).toBe(true);
	});

	it('shifts months across year boundaries', () => {
		expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
		expect(shiftMonth(2025, 12, 1)).toEqual({ year: 2026, month: 1 });
	});
});
