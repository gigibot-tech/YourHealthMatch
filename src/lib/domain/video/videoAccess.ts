/**
 * Where a video visit actually happens.
 * Clinic must offer video, and this doctor must be enabled.
 * Direct booking → room in this app. An external channel → that system, not a sidebar tab.
 */
import { CHANNEL_TO_SYSTEM, getSystemById } from '../externalSystems/catalog';
import type { Doctor, Practice } from '../practice/practiceProfileDefaults';

export type VisitModality = 'in_person' | 'video' | 'either';

export type VideoAccess =
	| { kind: 'none' }
	| { kind: 'in_app' }
	| { kind: 'external'; systemId: string; systemName: string };

export function practiceOffersVideo(
	practice: Pick<Practice, 'modalities'> | null | undefined
): boolean {
	return Boolean(practice?.modalities?.includes('video'));
}

export function resolveVideoAccess(input: {
	practice: Pick<Practice, 'modalities' | 'bookingChannel'> | null | undefined;
	doctor: Pick<Doctor, 'videoEnabled'> | null | undefined;
	modality: VisitModality | undefined;
}): VideoAccess {
	if (!input.modality || input.modality === 'in_person') return { kind: 'none' };
	// Missing flag follows the clinic. Explicit false turns this doctor off.
	if (!practiceOffersVideo(input.practice) || input.doctor?.videoEnabled === false) {
		return { kind: 'none' };
	}
	const channel = input.practice?.bookingChannel;
	const systemId = channel ? CHANNEL_TO_SYSTEM[channel] : undefined;
	if (systemId) {
		return {
			kind: 'external',
			systemId,
			systemName: getSystemById(systemId)?.name || systemId
		};
	}
	if (channel === 'direct') return { kind: 'in_app' };
	return { kind: 'none' };
}

/** Stored visit type: video only when this doctor can actually take one. */
export function modalityForVisit(
	asked: VisitModality,
	access: VideoAccess
): 'in_person' | 'video' {
	if (asked === 'in_person' || access.kind === 'none') return 'in_person';
	return 'video';
}
