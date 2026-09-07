import { describe, expect, it } from 'vitest';
import { canJoinVideo } from './telehealth';

describe('telehealth', () => {
	it('blocks join when not confirmed', () => {
		const r = canJoinVideo(
			{ status: 'requested', date: '2099-01-01', time: '10:00', modality: 'video' },
			'patient'
		);
		expect(r.ok).toBe(false);
	});

	it('allows join when confirmed video', () => {
		const r = canJoinVideo(
			{ status: 'confirmed', date: '2099-01-01', time: '10:00', modality: 'video' },
			'doctor'
		);
		expect(r.ok).toBe(true);
	});
});
