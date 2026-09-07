import {
  CANCEL_MIN_NOTICE_HOURS,
  canCancelAppointment,
  getScheduleChangeBlockReason,
  scheduleChangeDeniedMessage,
} from '../domain/cancellation.js';
import { cancelAppointment } from '../store/appointments.js';
import { escapeHtml } from '../lib/html.js';

export function cancelPolicyHint() {
  return `Cancel at least ${CANCEL_MIN_NOTICE_HOURS} hours before the visit.`;
}

export function cancelButtonHtml(appt) {
  if (canCancelAppointment(appt)) {
    return `<button type="button" class="btn btn-ghost btn-sm" data-cancel="${escapeHtml(appt.id)}">Cancel</button>`;
  }
  if (getScheduleChangeBlockReason(appt) === 'too_late') {
    const title = scheduleChangeDeniedMessage('too_late');
    return `<button type="button" class="btn btn-ghost btn-sm" disabled title="${escapeHtml(title)}">Cancel</button>`;
  }
  return '';
}

export function bindCancelActions(root, { onDone } = {}) {
  root.querySelectorAll('[data-cancel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cancel');
      if (!id) return;
      if (!window.confirm('Cancel this appointment? The time slot will open again.')) return;
      try {
        cancelAppointment(id);
        onDone?.();
      } catch (err) {
        window.alert(err.message);
      }
    });
  });
}
