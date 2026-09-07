import { describe, expect, it } from 'vitest';
import { cancellation, mayJoinVideo } from './policies';

describe('policies', () => {
	it('cancellation ok when >6h away', () => {
		const r = cancellation({
			appointment: {
				status: 'confirmed',
				date: '2099-01-01',
				time: '10:00'
			},
			actor: 'patient',
			now: Date.now()
		});
		expect(r.ok).toBe(true);
	});

	it('mayJoinVideo requires confirmed', () => {
		expect(
			mayJoinVideo({
				appointment: { status: 'requested', date: '2099-01-01', time: '10:00' },
				actor: 'patient',
				now: Date.now()
			}).ok
		).toBe(false);
		expect(
			mayJoinVideo({
				appointment: {
					status: 'confirmed',
					date: '2099-01-01',
					time: '10:00',
					modality: 'video'
				},
				actor: 'patient',
				now: Date.now()
			}).ok
		).toBe(true);
	});
});
