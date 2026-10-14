/**
 * Outbound patient notification port — swap local/demo for push/email/webhook
 * without touching domain or UI.
 */
export type VisitCompletedPayload = {
	appointmentId: string;
	patientId: string;
	status: 'completed';
	completedAt: string;
};

export type VisitCancelledPayload = {
	appointmentId: string;
	patientId: string;
	/** Cancelled = closed after request/confirm; rejected = doctor declined a request. */
	status: 'cancelled' | 'rejected';
	cancelledAt: string;
	cancelledBy: 'doctor' | 'patient';
};

export type NotifyResult = {
	/** Stable notification id (or prior id when idempotent). */
	id: string;
	delivered: boolean;
	/** True when this appointment already had this notification kind. */
	idempotent: boolean;
};

export type NotificationPort = {
	/**
	 * Deliver a patient-facing “visit completed / request” notification.
	 * Must be idempotent per appointmentId.
	 */
	notifyVisitCompleted(payload: VisitCompletedPayload): Promise<NotifyResult>;
	/**
	 * Deliver a patient-facing visit cancelled / declined notification.
	 * Must be idempotent per appointmentId.
	 */
	notifyVisitCancelled(payload: VisitCancelledPayload): Promise<NotifyResult>;
};
