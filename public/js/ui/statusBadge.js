import { escapeHtml } from '../lib/html.js';

const BADGE_CLASS = {
  confirmed: 'badge-confirmed',
  pending: 'badge-pending',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};

export function statusBadge(status) {
  const cls = BADGE_CLASS[status] || 'badge-completed';
  const label = String(status || 'unknown');
  const pretty = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
  return `<span class="badge ${cls}">${escapeHtml(pretty)}</span>`;
}
