/**
 * Appointment lifecycle table + engine — single owner of status transitions.
 * Edit `appointmentLifecycle` below; runtime API: transition / allowedActions / canTransition.
 */
import { runPolicy } from './policies';
import type { AppointmentLike } from './policies';

export type AppointmentStatus =
	| 'requested'
	| 'confirmed'
	| 'completed'
	| 'cancelled'
	| 'rejected'
	| 'no_show';

export type ActionId =
	| 'confirm'
	| 'reject'
	| 'cancel'
	| 'complete'
	| 'no_show'
	| 'join_video';

export type Role = 'patient' | 'doctor';
export type PolicyName = 'cancellation' | 'mayJoinVideo';

export type LifecycleTransition = {
	action: ActionId;
	from: AppointmentStatus | AppointmentStatus[];
	to: AppointmentStatus;
	by: Role[];
	policy?: PolicyName;
};

export type LifecycleStateMeta = {
	label: string;
	badge: 'pending' | 'confirmed' | 'done' | 'cancelled';
};

export const appointmentLifecycle = {
	states: {
		requested: { label: 'Requested', badge: 'pending' },
		confirmed: { label: 'Confirmed', badge: 'confirmed' },
		completed: { label: 'Completed', badge: 'done' },
		cancelled: { label: 'Cancelled', badge: 'cancelled' },
		rejected: { label: 'Declined', badge: 'cancelled' },
		no_show: { label: 'No show', badge: 'cancelled' }
	} satisfies Record<AppointmentStatus, LifecycleStateMeta>,
	transitions: [
		{ action: 'confirm', from: 'requested', to: 'confirmed', by: ['doctor'] },
		{ action: 'reject', from: 'requested', to: 'rejected', by: ['doctor'] },
		{
			action: 'cancel',
			from: ['requested', 'confirmed'],
			to: 'cancelled',
			by: ['patient', 'doctor'],
			policy: 'cancellation'
		},
		{ action: 'complete', from: 'confirmed', to: 'completed', by: ['doctor'] },
		{ action: 'no_show', from: 'confirmed', to: 'no_show', by: ['doctor'] },
		{
			action: 'join_video',
			from: 'confirmed',
			to: 'confirmed',
			by: ['patient', 'doctor'],
			policy: 'mayJoinVideo'
		}
	] satisfies LifecycleTransition[]
};

export type LifecycleError = { code: string; message: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: LifecycleError };

function fromMatches(from: AppointmentStatus | AppointmentStatus[], status: AppointmentStatus) {
	return Array.isArray(from) ? from.includes(status) : from === status;
}

export function canTransition(
	status: AppointmentStatus,
	action: ActionId,
	ctx: { actor: Role; now: number; appointment: AppointmentLike }
): boolean {
	return transition(status, action, ctx).ok;
}

export function transition(
	status: AppointmentStatus,
	action: ActionId,
	ctx: { actor: Role; now: number; appointment: AppointmentLike }
): Result<AppointmentStatus> {
	const edge = appointmentLifecycle.transitions.find(
		(t) => t.action === action && fromMatches(t.from, status)
	);
	if (!edge) {
		return {
			ok: false,
			error: { code: 'invalid_transition', message: `Cannot ${action} from ${status}` }
		};
	}
	if (!edge.by.includes(ctx.actor)) {
		return {
			ok: false,
			error: { code: 'forbidden', message: `${ctx.actor} cannot ${action}` }
		};
	}
	if (edge.policy) {
		const policyResult = runPolicy(edge.policy, {
			appointment: { ...ctx.appointment, status },
			actor: ctx.actor,
			now: ctx.now
		});
		if (!policyResult.ok) {
			return { ok: false, error: { code: 'policy', message: policyResult.reason } };
		}
	}
	return { ok: true, value: edge.to };
}

export function allowedActions(
	appointment: AppointmentLike,
	actor: Role,
	now: number
): ActionId[] {
	const actions: ActionId[] = [];
	for (const t of appointmentLifecycle.transitions) {
		if (!fromMatches(t.from, appointment.status)) continue;
		if (!t.by.includes(actor)) continue;
		const r = transition(appointment.status, t.action, { actor, now, appointment });
		if (r.ok) actions.push(t.action);
	}
	return actions;
}
