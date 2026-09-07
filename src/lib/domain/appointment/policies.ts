import { CANCEL_MIN_NOTICE_HOURS } from '$lib/config/clinicPolicy';
import type { AppointmentStatus, PolicyName, Role } from './lifecycleEngine';

export type PolicyResult = { ok: true } | { ok: false; reason: string };

export type AppointmentLike = {
	id?: string;
	status: AppointmentStatus;
	date: string;
	time: string;
	modality?: 'in_person' | 'video' | 'either';
};

export type PolicyContext = {
	appointment: AppointmentLike;
	actor: Role;
	now: number;
};

export type PolicyFn = (ctx: PolicyContext) => PolicyResult;

export function appointmentStartMs(appt: { date: string; time: string }): number {
	if (!appt?.date || !appt?.time) return NaN;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(appt.date)) return NaN;
	const match = /^(\d{2}):(\d{2})$/.exec(appt.time);
	if (!match) return NaN;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours > 23 || minutes > 59) return NaN;
	return new Date(`${appt.date}T${match[1]}:${match[2]}:00`).getTime();
}

export function cancellation(ctx: PolicyContext): PolicyResult {
	const { appointment, now } = ctx;
	if (appointment.status !== 'requested' && appointment.status !== 'confirmed') {
		return { ok: false, reason: 'This appointment can no longer be changed.' };
	}
	const start = appointmentStartMs(appointment);
	if (!Number.isFinite(start)) {
		return { ok: false, reason: 'This appointment has an invalid date or time.' };
	}
	const minMs = CANCEL_MIN_NOTICE_HOURS * 60 * 60 * 1000;
	if (start - now < minMs) {
		return {
			ok: false,
			reason: `Changes must be at least ${CANCEL_MIN_NOTICE_HOURS} hours before the visit.`
		};
	}
	return { ok: true };
}

export function mayJoinVideo(ctx: PolicyContext): PolicyResult {
	const { appointment } = ctx;
	if (appointment.status !== 'confirmed') {
		return { ok: false, reason: 'Only confirmed appointments can join video.' };
	}
	if (appointment.modality === 'in_person') {
		return { ok: false, reason: 'This appointment is in-person only.' };
	}
	return { ok: true };
}

/** Name → fn registry — lifecycle table references policies by string. */
const registry: Record<string, PolicyFn> = {
	cancellation,
	mayJoinVideo
};

export const policies = registry as Record<PolicyName, PolicyFn> & Record<string, PolicyFn>;

export function registerPolicy(name: string, fn: PolicyFn): void {
	registry[name] = fn;
}

export function runPolicy(name: PolicyName | string, ctx: PolicyContext): PolicyResult {
	const fn = registry[name];
	if (!fn) return { ok: false, reason: `Unknown policy: ${name}` };
	return fn(ctx);
}
