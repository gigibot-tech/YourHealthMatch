import { buildHold, holdBlocks, holdIsActive, type SlotHold } from '$lib/domain/scheduling/slotHold';
import { createLocalRepo } from './localRepos';

const repo = createLocalRepo<SlotHold>('yhm_slot_holds_v1', () => [], { reseedIfEmpty: false });

function purgeExpired(now = Date.now()) {
	const alive = repo.getAll().filter((h) => holdIsActive(h, now));
	if (alive.length !== repo.getAll().length) repo.replaceAll(alive);
	return alive;
}

export const slotHoldStore = {
	list(now = Date.now()) {
		return purgeExpired(now);
	},

	get(id: string, now = Date.now()) {
		purgeExpired(now);
		return repo.get(id);
	},

	find(input: {
		practiceId: string;
		doctorId: string;
		date: string;
		time: string;
	}, now = Date.now()) {
		purgeExpired(now);
		return (
			repo
				.getAll()
				.find(
					(h) =>
						h.practiceId === input.practiceId &&
						h.doctorId === input.doctorId &&
						h.date === input.date &&
						h.time === input.time &&
						holdIsActive(h, now)
				) ?? null
		);
	},

	place(input: {
		practiceId: string;
		doctorId: string;
		date: string;
		time: string;
		holderId: string;
	}, now = Date.now()): SlotHold {
		purgeExpired(now);
		const existing = this.find(input, now);
		if (existing && holdBlocks(existing, input.holderId, now)) {
			throw new Error('That time is held by another patient. Try again in a few minutes.');
		}
		const hold = buildHold(input, now);
		return repo.save(hold);
	},

	release(id: string) {
		repo.remove(id);
	},

	releaseSlot(input: {
		practiceId: string;
		doctorId: string;
		date: string;
		time: string;
		holderId?: string;
	}) {
		const hold = this.find(input);
		if (!hold) return;
		if (input.holderId && hold.holderId !== input.holderId) return;
		repo.remove(hold.id);
	},

	isBlocked(
		input: {
			practiceId: string;
			doctorId: string;
			date: string;
			time: string;
		},
		holderId: string,
		now = Date.now()
	) {
		return holdBlocks(this.find(input, now), holderId, now);
	},

	subscribe(listener: (all: SlotHold[]) => void) {
		return repo.subscribe(listener);
	},

	replaceAll(items: SlotHold[]) {
		repo.replaceAll(items);
	}
};
