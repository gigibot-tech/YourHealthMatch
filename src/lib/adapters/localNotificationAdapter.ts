/**
 * Local/demo NotificationPort — persists so the patient inbox can read it.
 * Swap `createStubNotificationPort` for real push/email/webhook later.
 */
import { createLocalRepo } from './localRepos';
import type {
	NotificationPort,
	NotifyResult,
	VisitCancelledPayload,
	VisitCompletedPayload
} from '$lib/ports/NotificationPort';

type NotificationBase = {
	id: string;
	createdAt: string;
	readAt: string | null;
};

export type VisitCompletedNotification = VisitCompletedPayload &
	NotificationBase & {
		type: 'visit_completed';
	};

export type VisitCancelledNotification = VisitCancelledPayload &
	NotificationBase & {
		type: 'visit_cancelled';
	};

export type PatientNotification = VisitCompletedNotification | VisitCancelledNotification;

export type PatientNotificationStore = NotificationPort & {
	listForPatient(patientId: string): PatientNotification[];
	get(id: string): PatientNotification | null;
	markRead(id: string, at?: string): PatientNotification | null;
	replaceAll(items: PatientNotification[]): void;
	subscribe(listener: (all: PatientNotification[]) => void): () => void;
};

function completedNotificationId(appointmentId: string): string {
	return `notif_visit_completed_${appointmentId}`;
}

function cancelledNotificationId(appointmentId: string): string {
	return `notif_visit_cancelled_${appointmentId}`;
}

export function createLocalNotificationAdapter(
	storageKey = 'yhm_patient_notifications_v1'
): PatientNotificationStore {
	const repo = createLocalRepo<PatientNotification>(storageKey, () => []);

	return {
		async notifyVisitCompleted(payload: VisitCompletedPayload): Promise<NotifyResult> {
			const id = completedNotificationId(payload.appointmentId);
			const existing = repo.get(id);
			if (existing) {
				return { id: existing.id, delivered: false, idempotent: true };
			}
			const record: VisitCompletedNotification = {
				id,
				type: 'visit_completed',
				appointmentId: payload.appointmentId,
				patientId: payload.patientId,
				status: 'completed',
				completedAt: payload.completedAt,
				createdAt: payload.completedAt,
				readAt: null
			};
			repo.save(record);
			return { id, delivered: true, idempotent: false };
		},

		async notifyVisitCancelled(payload: VisitCancelledPayload): Promise<NotifyResult> {
			const id = cancelledNotificationId(payload.appointmentId);
			const existing = repo.get(id);
			if (existing) {
				return { id: existing.id, delivered: false, idempotent: true };
			}
			const record: VisitCancelledNotification = {
				id,
				type: 'visit_cancelled',
				appointmentId: payload.appointmentId,
				patientId: payload.patientId,
				status: payload.status,
				cancelledAt: payload.cancelledAt,
				cancelledBy: payload.cancelledBy,
				createdAt: payload.cancelledAt,
				readAt: null
			};
			repo.save(record);
			return { id, delivered: true, idempotent: false };
		},

		listForPatient(patientId: string) {
			return repo
				.getAll()
				.filter((n) => n.patientId === patientId)
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
		},

		get(id: string) {
			return repo.get(id);
		},

		markRead(id: string, at = new Date().toISOString()) {
			const existing = repo.get(id);
			if (!existing) return null;
			if (existing.readAt) return existing;
			return repo.save({ ...existing, readAt: at });
		},

		replaceAll(items: PatientNotification[]) {
			repo.replaceAll(items);
		},

		subscribe(listener) {
			return repo.subscribe(listener);
		}
	};
}

/** In-memory / console stub for a future push/email/webhook channel. */
export function createStubNotificationPort(
	log: (msg: string, payload: VisitCompletedPayload | VisitCancelledPayload) => void = console.info
): NotificationPort {
	const seenCompleted = new Set<string>();
	const seenCancelled = new Set<string>();
	return {
		async notifyVisitCompleted(payload: VisitCompletedPayload): Promise<NotifyResult> {
			const id = completedNotificationId(payload.appointmentId);
			if (seenCompleted.has(payload.appointmentId)) {
				return { id, delivered: false, idempotent: true };
			}
			seenCompleted.add(payload.appointmentId);
			log('[yhm] stub notify visit completed', payload);
			return { id, delivered: true, idempotent: false };
		},
		async notifyVisitCancelled(payload: VisitCancelledPayload): Promise<NotifyResult> {
			const id = cancelledNotificationId(payload.appointmentId);
			if (seenCancelled.has(payload.appointmentId)) {
				return { id, delivered: false, idempotent: true };
			}
			seenCancelled.add(payload.appointmentId);
			log('[yhm] stub notify visit cancelled', payload);
			return { id, delivered: true, idempotent: false };
		}
	};
}

/** Default demo store used by the app. */
export const localNotificationStore = createLocalNotificationAdapter();
