/**
 * Soft hold on a published slot while the patient finishes booking (5 minutes).
 * Local only — no external calendar API.
 */

export type SlotHold = {
	id: string;
	practiceId: string;
	doctorId: string;
	date: string;
	time: string;
	holderId: string;
	until: string;
};

export const SLOT_HOLD_MS = 5 * 60 * 1000;

export function holdId(input: {
	practiceId: string;
	doctorId: string;
	date: string;
	time: string;
}): string {
	return `hold_${input.practiceId}_${input.doctorId}_${input.date}_${input.time}`;
}

export function buildHold(
	input: {
		practiceId: string;
		doctorId: string;
		date: string;
		time: string;
		holderId: string;
	},
	now = Date.now()
): SlotHold {
	return {
		id: holdId(input),
		practiceId: input.practiceId,
		doctorId: input.doctorId,
		date: input.date,
		time: input.time,
		holderId: input.holderId,
		until: new Date(now + SLOT_HOLD_MS).toISOString()
	};
}

export function holdIsActive(hold: SlotHold, now = Date.now()): boolean {
	return new Date(hold.until).getTime() > now;
}

/** True when another patient still holds this slot. */
export function holdBlocks(
	hold: SlotHold | null | undefined,
	holderId: string,
	now = Date.now()
): boolean {
	if (!hold || !holdIsActive(hold, now)) return false;
	return hold.holderId !== holderId;
}
