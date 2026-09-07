import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANCEL_MIN_NOTICE_HOURS,
  canCancelAppointment,
  getScheduleChangeBlockReason,
  appointmentStartMs,
  scheduleChangeDeniedMessage,
} from './cancellation.js';

const HOUR_MS = 60 * 60 * 1000;

function apptAt(isoDate, time, status = 'confirmed') {
  return { id: 'appt_test', date: isoDate, time, status };
}

test('policy constant is 6 hours', () => {
  assert.equal(CANCEL_MIN_NOTICE_HOURS, 6);
});

test('allows cancel when more than 6 hours remain', () => {
  const start = Date.parse('2026-09-10T15:00:00');
  const now = start - CANCEL_MIN_NOTICE_HOURS * HOUR_MS - 1;
  const appt = apptAt('2026-09-10', '15:00');
  assert.equal(appointmentStartMs(appt), start);
  assert.equal(canCancelAppointment(appt, now), true);
  assert.equal(getScheduleChangeBlockReason(appt, now), null);
});

test('blocks cancel inside the 6-hour window', () => {
  const start = Date.parse('2026-09-10T15:00:00');
  const now = start - CANCEL_MIN_NOTICE_HOURS * HOUR_MS + 1;
  const appt = apptAt('2026-09-10', '15:00');
  assert.equal(getScheduleChangeBlockReason(appt, now), 'too_late');
  assert.match(scheduleChangeDeniedMessage('too_late'), /6 hours/);
});

test('blocks cancel for completed or cancelled visits', () => {
  const appt = apptAt('2026-09-20', '10:00', 'cancelled');
  assert.equal(getScheduleChangeBlockReason(appt), 'not_cancellable');
});

test('rejects invalid times', () => {
  assert.equal(getScheduleChangeBlockReason({ date: 'bad', time: '10:00', status: 'pending' }), 'invalid_time');
});
