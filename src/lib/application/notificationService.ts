/**
 * Patient notification application layer — outbound port + demo inbox reads.
 * Side effects for visit complete / cancel live here (via transitionHooks), not in domain/UI.
 */
import type { Appointment } from '$lib/domain/appointment/Appointment';
import type { ActionId, Role } from '$lib/domain/appointment/lifecycleEngine';
import type {
	NotificationPort,
	NotifyResult,
	VisitCancelledPayload,
	VisitCompletedPayload
} from '$lib/ports/NotificationPort';
import {
	createStubNotificationPort,
	localNotificationStore,
	type PatientNotification,
	type PatientNotificationStore
} from '$lib/adapters/localNotificationAdapter';
import { registerTransitionHook } from './transitionHooks';

export type { VisitCancelledPayload, VisitCompletedPayload, NotifyResult, PatientNotification };
export { createStubNotificationPort };

export type NotificationService = {
	notifyVisitCompleted(payload: VisitCompletedPayload): Promise<NotifyResult>;
	notifyVisitCancelled(payload: VisitCancelledPayload): Promise<NotifyResult>;
	listForPatient(patientId: string): PatientNotification[];
	unreadForPatient(patientId: string): PatientNotification[];
	markRead(id: string): PatientNotification | null;
	subscribe(listener: (all: PatientNotification[]) => void): () => void;
};

export function createNotificationService(
	store: PatientNotificationStore = localNotificationStore
): NotificationService {
	return {
		notifyVisitCompleted(payload) {
			return store.notifyVisitCompleted(payload);
		},
		notifyVisitCancelled(payload) {
			return store.notifyVisitCancelled(payload);
		},
		listForPatient(patientId) {
			return store.listForPatient(patientId);
		},
		unreadForPatient(patientId) {
			return store.listForPatient(patientId).filter((n) => !n.readAt);
		},
		markRead(id) {
			return store.markRead(id);
		},
		subscribe(listener) {
			return store.subscribe(listener);
		}
	};
}

export const notificationService = createNotificationService();

/** Optional secondary channel (email/push/webhook) — no-op stub until wired. */
let outboundChannel: NotificationPort = createStubNotificationPort();

export function setOutboundNotificationChannel(port: NotificationPort) {
	outboundChannel = port;
}

async function onVisitCompleted(appt: Appointment, completedAt: string) {
	const payload: VisitCompletedPayload = {
		appointmentId: appt.id,
		patientId: appt.patientId,
		status: 'completed',
		completedAt
	};
	await notificationService.notifyVisitCompleted(payload);
	try {
		await outboundChannel.notifyVisitCompleted(payload);
	} catch (e) {
		console.error('outbound visit-completed notify failed', e);
	}
}

async function onVisitCancelled(appt: Appointment, payload: VisitCancelledPayload) {
	await notificationService.notifyVisitCancelled(payload);
	try {
		await outboundChannel.notifyVisitCancelled(payload);
	} catch (e) {
		console.error('outbound visit-cancelled notify failed', e);
	}
}

function cancelledByFrom(appt: Appointment, fallback: Role): 'doctor' | 'patient' {
	return appt.cancelledBy === 'patient' || appt.cancelledBy === 'doctor'
		? appt.cancelledBy
		: fallback;
}

registerTransitionHook('patientVisitCompletedNotify', async (action: ActionId, appt: Appointment) => {
	if (action !== 'complete') return;
	await onVisitCompleted(appt, new Date().toISOString());
});

registerTransitionHook('patientVisitCancelledNotify', async (action: ActionId, appt: Appointment) => {
	if (action !== 'cancel' && action !== 'reject') return;
	const cancelledBy = cancelledByFrom(appt, action === 'reject' ? 'doctor' : 'patient');
	// Patient-initiated cancel: do not push a self-notification into their practice inbox.
	if (cancelledBy === 'patient') return;
	const cancelledAt = appt.cancelledAt ?? new Date().toISOString();
	await onVisitCancelled(appt, {
		appointmentId: appt.id,
		patientId: appt.patientId,
		status: action === 'reject' ? 'rejected' : 'cancelled',
		cancelledAt,
		cancelledBy
	});
});
