/**
 * Patient time bands for two-way availability (local only).
 * preferredWindow stores comma-separated band ids, or empty / "any".
 */

export type TimeBandId = 'morning' | 'lunch' | 'evening' | 'any';

export type TimeBand = {
	id: TimeBandId;
	label: string;
	/** Inclusive start minute-of-day; exclusive end. Null = any time. */
	startMin: number | null;
	endMin: number | null;
};

export const TIME_BANDS: readonly TimeBand[] = [
	{ id: 'any', label: 'Any time', startMin: null, endMin: null },
	{ id: 'morning', label: 'Before 09:00', startMin: 0, endMin: 9 * 60 },
	{ id: 'lunch', label: '12:00–14:00', startMin: 12 * 60, endMin: 14 * 60 },
	{ id: 'evening', label: 'After 17:00', startMin: 17 * 60, endMin: 24 * 60 }
];

function parseHm(hm: string): number {
	const [h, m] = hm.split(':').map(Number);
	return h * 60 + (m || 0);
}

export function parsePreferredWindow(raw: string | undefined | null): TimeBandId[] {
	const parts = (raw || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean) as TimeBandId[];
	if (!parts.length || parts.includes('any')) return ['any'];
	const known = new Set(TIME_BANDS.map((b) => b.id));
	const valid = parts.filter((p) => known.has(p));
	return valid.length ? valid : ['any'];
}

export function serializePreferredWindow(ids: TimeBandId[]): string {
	if (!ids.length || ids.includes('any')) return 'any';
	return [...new Set(ids)].join(',');
}

export function timeInPreferredWindow(time: string, preferredWindow: string): boolean {
	const bands = parsePreferredWindow(preferredWindow);
	if (bands.includes('any')) return true;
	const mins = parseHm(time);
	return bands.some((id) => {
		const band = TIME_BANDS.find((b) => b.id === id);
		if (!band || band.startMin == null || band.endMin == null) return true;
		return mins >= band.startMin && mins < band.endMin;
	});
}
