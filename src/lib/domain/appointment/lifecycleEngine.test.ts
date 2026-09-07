import { describe, expect, it } from 'vitest';
import { allowedActions, transition } from './lifecycleEngine';
import type { AppointmentLike } from './policies';
// lifecycle table lives in lifecycleEngine.ts (merged)

const base: AppointmentLike = {
	id: 'appt_1',
	status: 'requested',
	date: '2099-06-01',
	time: '10:00',
	modality: 'video'
};

describe('lifecycleEngine', () => {
	it('allows doctor to confirm requested → confirmed', () => {
		const r = transition('requested', 'confirm', {
			actor: 'doctor',
			now: Date.now(),
			appointment: base
		});
		expect(r.ok && r.value).toBe('confirmed');
	});

	it('blocks patient from confirming', () => {
		const r = transition('requested', 'confirm', {
			actor: 'patient',
			now: Date.now(),
			appointment: base
		});
		expect(r.ok).toBe(false);
	});

	it('enforces cancellation 6h policy', () => {
		const now = Date.parse('2026-09-07T12:00:00');
		const soon: AppointmentLike = {
			...base,
			status: 'confirmed',
			date: '2026-09-07',
			time: '14:00' // only 2h away
		};
		const r = transition('confirmed', 'cancel', {
			actor: 'patient',
			now,
			appointment: soon
		});
		expect(r.ok).toBe(false);
	});

	it('lists allowedActions for doctor on requested', () => {
		const actions = allowedActions(base, 'doctor', Date.now());
		expect(actions).toContain('confirm');
		expect(actions).toContain('reject');
		expect(actions).toContain('cancel');
	});

	it('allows join_video only when confirmed', () => {
		const confirmed = { ...base, status: 'confirmed' as const };
		expect(allowedActions(confirmed, 'patient', Date.now())).toContain('join_video');
		expect(allowedActions(base, 'patient', Date.now())).not.toContain('join_video');
	});
});
