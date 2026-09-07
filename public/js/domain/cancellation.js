/**
 * Cancellation and reschedule cutoff.
 * Policy number lives in config/clinicPolicy.js — do not hardcode hours elsewhere.
 */

import { CANCEL_MIN_NOTICE_HOURS } from '../config/clinicPolicy.js';

export { CANCEL_MIN_NOTICE_HOURS };

const CANCEL_MIN_NOTICE_MS = CANCEL_MIN_NOTICE_HOURS * 60 * 60 * 1000;
const MUTABLE_STATUSES = new Set(['pending', 'confirmed']);

export function appointmentStartMs(appt) {
  if (!appt?.date || !appt?.time) return NaN;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appt.date)) return NaN;
  const match = /^(\d{2}):(\d{2})$/.exec(appt.time);
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return NaN;
  return new Date(`${appt.date}T${match[1]}:${match[2]}:00`).getTime();
}

export function getScheduleChangeBlockReason(appt, now = Date.now()) {
  if (!appt) return 'not_found';
  if (!MUTABLE_STATUSES.has(appt.status)) return 'not_cancellable';
  const start = appointmentStartMs(appt);
  if (!Number.isFinite(start)) return 'invalid_time';
  if (start - now < CANCEL_MIN_NOTICE_MS) return 'too_late';
  return null;
}

export function canCancelAppointment(appt, now = Date.now()) {
  return getScheduleChangeBlockReason(appt, now) === null;
}

export function scheduleChangeDeniedMessage(reason) {
  switch (reason) {
    case 'too_late':
      return `Changes must be at least ${CANCEL_MIN_NOTICE_HOURS} hours before the visit.`;
    case 'not_cancellable':
      return 'This appointment can no longer be changed.';
    case 'not_found':
      return 'Appointment not found.';
    case 'invalid_time':
      return 'This appointment has an invalid date or time.';
    default:
      return 'This appointment cannot be changed.';
  }
}

export function assertCanChangeSchedule(appt, now = Date.now()) {
  const reason = getScheduleChangeBlockReason(appt, now);
  if (reason) throw new Error(scheduleChangeDeniedMessage(reason));
}
