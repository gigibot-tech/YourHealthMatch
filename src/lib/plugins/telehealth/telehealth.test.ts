import { describe, expect, it } from 'vitest';
import { canJoinVideo, fetchVideoToken } from './telehealth';
import { RemoteApiUnavailableError } from '$lib/adapters/httpApi';

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

	it('refuses token fetch when this host has no API origin', async () => {
		await expect(
			fetchVideoToken({ appointmentId: 'appt_1', channelName: 'ch' })
		).rejects.toBeInstanceOf(RemoteApiUnavailableError);
	});
});
