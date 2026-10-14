import { describe, expect, it } from 'vitest';
import { modalityForVisit, resolveVideoAccess } from './videoAccess';

const clinic = { modalities: ['in_person', 'video'], bookingChannel: 'direct' as const };
const enabled = { videoEnabled: true };
const off = { videoEnabled: false };

describe('resolveVideoAccess', () => {
	it('is in-app only when the clinic offers video, this doctor is not turned off, and booking is here', () => {
		expect(
			resolveVideoAccess({ practice: clinic, doctor: enabled, modality: 'video' })
		).toEqual({ kind: 'in_app' });
		expect(
			resolveVideoAccess({ practice: clinic, doctor: {}, modality: 'video' }).kind
		).toBe('in_app');
	});

	it('sends video to the external system when the clinic books there', () => {
		expect(
			resolveVideoAccess({
				practice: { modalities: ['video'], bookingChannel: 'doctolib' },
				doctor: enabled,
				modality: 'video'
			})
		).toMatchObject({ kind: 'external', systemId: 'doctolib', systemName: 'Doctolib' });
	});

	it('is none when the doctor is not enabled, or the visit is in person', () => {
		expect(resolveVideoAccess({ practice: clinic, doctor: off, modality: 'video' }).kind).toBe(
			'none'
		);
		expect(
			resolveVideoAccess({ practice: clinic, doctor: enabled, modality: 'in_person' }).kind
		).toBe('none');
		expect(
			resolveVideoAccess({
				practice: { modalities: ['in_person'], bookingChannel: 'direct' },
				doctor: enabled,
				modality: 'video'
			}).kind
		).toBe('none');
	});

	it('stores in-person when video is not actually available', () => {
		expect(modalityForVisit('either', { kind: 'none' })).toBe('in_person');
		expect(modalityForVisit('video', { kind: 'external', systemId: 'doctolib', systemName: 'Doctolib' })).toBe(
			'video'
		);
	});
});
