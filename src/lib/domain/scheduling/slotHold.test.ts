import { describe, expect, it } from 'vitest';
import { buildHold, holdBlocks, holdIsActive, SLOT_HOLD_MS } from './slotHold';

describe('slot soft hold', () => {
	const base = {
		practiceId: 'prac_a',
		doctorId: 'doc_a',
		date: '2030-01-02',
		time: '10:00',
		holderId: 'pat_1'
	};

	it('stays active for five minutes', () => {
		const now = Date.parse('2030-01-01T12:00:00Z');
		const hold = buildHold(base, now);
		expect(holdIsActive(hold, now + SLOT_HOLD_MS - 1)).toBe(true);
		expect(holdIsActive(hold, now + SLOT_HOLD_MS + 1)).toBe(false);
	});

	it('blocks other holders while fresh', () => {
		const now = Date.parse('2030-01-01T12:00:00Z');
		const hold = buildHold(base, now);
		expect(holdBlocks(hold, 'pat_1', now)).toBe(false);
		expect(holdBlocks(hold, 'pat_2', now)).toBe(true);
		expect(holdBlocks(hold, 'pat_2', now + SLOT_HOLD_MS + 1)).toBe(false);
	});
});
