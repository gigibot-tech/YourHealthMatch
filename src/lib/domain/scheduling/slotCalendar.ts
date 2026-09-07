import type { WeeklyHours } from '../practice/practiceProfileDefaults';

export const SLOT_STEP_MINUTES = 30;

export type Slot = { date: string; time: string };

export type DateChip = {
	iso: string;
	day: string;
	dateNum: number;
	label: string;
};

export type Clock = { now: () => Date };

function pad2(n: number) {
	return String(n).padStart(2, '0');
}

export function toISODate(d: Date): string {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const DOW: (keyof WeeklyHours)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function parseHm(hm: string): number {
	const [h, m] = hm.split(':').map(Number);
	return h * 60 + m;
}

function formatHm(mins: number): string {
	return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
}

function slotsFromRange(startHm: string, endHm: string, stepMin = 30): string[] {
	const start = parseHm(startHm);
	const end = parseHm(endHm);
	const out: string[] = [];
	for (let t = start; t + stepMin <= end; t += stepMin) {
		out.push(formatHm(t));
	}
	return out;
}

export function dateStrip(days = 7, clock: Clock = { now: () => new Date() }): DateChip[] {
	const out: DateChip[] = [];
	const base = clock.now();
	for (let i = 0; i < days; i++) {
		const d = new Date(base);
		d.setDate(base.getDate() + i);
		out.push({
			iso: toISODate(d),
			day: d.toLocaleDateString('en-US', { weekday: 'short' }),
			dateNum: d.getDate(),
			label: d.toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'short',
				day: 'numeric'
			})
		});
	}
	return out;
}

export function isSlotAvailable(slot: Slot, booked: Slot[]): boolean {
	return !booked.some((b) => b.date === slot.date && b.time === slot.time);
}

export function openSlots(input: {
	weeklyHours?: WeeklyHours;
	explicitSlots?: Slot[];
	booked: Slot[];
	fromDate: string;
	days?: number;
	stepMin?: number;
}): Slot[] {
	const days = input.days ?? 7;
	const stepMin = input.stepMin ?? SLOT_STEP_MINUTES;
	const booked = input.booked;
	const results: Slot[] = [];

	if (input.explicitSlots?.length) {
		for (const s of input.explicitSlots) {
			if (s.date >= input.fromDate && isSlotAvailable(s, booked)) {
				results.push(s);
			}
		}
	}

	if (input.weeklyHours) {
		const [y, m, d] = input.fromDate.split('-').map(Number);
		for (let i = 0; i < days; i++) {
			const date = new Date(y, m - 1, d + i);
			const iso = toISODate(date);
			const key = DOW[date.getDay()];
			const range = input.weeklyHours[key];
			if (!range) continue;
			for (const time of slotsFromRange(range[0], range[1], stepMin)) {
				const slot = { date: iso, time };
				if (isSlotAvailable(slot, booked) && !results.some((r) => r.date === iso && r.time === time)) {
					results.push(slot);
				}
			}
		}
	}

	return results.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function nextAvailableWithinDays(slots: Slot[], days: number, fromDate: string): Slot | null {
	const end = new Date(`${fromDate}T12:00:00`);
	end.setDate(end.getDate() + days);
	const endIso = toISODate(end);
	return slots.find((s) => s.date >= fromDate && s.date <= endIso) ?? null;
}

export function hasClash(
	slot: Slot,
	booked: Slot[],
	exclude?: { date: string; time: string }
): boolean {
	return booked.some(
		(b) =>
			b.date === slot.date &&
			b.time === slot.time &&
			!(exclude && exclude.date === b.date && exclude.time === b.time)
	);
}
