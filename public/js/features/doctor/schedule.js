import { mountShell } from '../shell.js';
import { navigate } from '../../router.js';
import {
  getActiveDoctor,
  getForDoctorOnDate,
  dateStrip,
  todayISODate,
  formatTime,
  confirmAppointment,
  setVideoSession,
  subscribe,
} from '../../store/appointments.js';
import { statusBadge } from '../../ui/statusBadge.js';
import { bindCancelActions, cancelButtonHtml, cancelPolicyHint } from '../../ui/cancelControls.js';
import { escapeHtml } from '../../lib/html.js';

export function mountDoctorSchedule(root) {
  let selectedDate = todayISODate();
  let unsub = null;

  const paint = () => {
    const doctor = getActiveDoctor();
    const strip = dateStrip(7);
    const list = getForDoctorOnDate(doctor.id, selectedDate);

    const content = `
      <div class="page-header">
        <div>
          <h1>Schedule</h1>
          <p class="sub">${escapeHtml(doctor.name)} · clinic calendar</p>
          <p class="policy-hint">${escapeHtml(cancelPolicyHint())}</p>
        </div>
      </div>
      <div class="date-strip">
        ${strip
          .map(
            (d) => `
          <button type="button" class="date-chip${d.iso === selectedDate ? ' active' : ''}" data-date="${escapeHtml(d.iso)}">
            <div class="day">${escapeHtml(d.day)}</div>
            <div class="num">${d.dateNum}</div>
          </button>`
          )
          .join('')}
      </div>
      <h2 class="section-title">${escapeHtml(strip.find((d) => d.iso === selectedDate)?.label || selectedDate)}</h2>
      ${
        list.length === 0
          ? `<div class="empty-state">No appointments this day.</div>`
          : list
              .map(
                (a) => `
            <div class="card appt-card">
              <div class="meta">
                <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
                  <h3>${escapeHtml(a.patientName)}</h3>
                  ${statusBadge(a.status)}
                </div>
                <div class="detail">${escapeHtml(formatTime(a.time))} · ${escapeHtml(a.reason)}</div>
                <div class="detail">${escapeHtml(a.location)}</div>
              </div>
              <div class="appt-actions">
                ${
                  a.status === 'pending'
                    ? `<button type="button" class="btn btn-primary btn-sm" data-confirm="${escapeHtml(a.id)}">Confirm</button>`
                    : a.status === 'confirmed'
                      ? `<button type="button" class="btn btn-primary btn-sm" data-join="${escapeHtml(a.id)}">Join Video</button>`
                      : ''
                }
                ${cancelButtonHtml(a)}
              </div>
            </div>`
              )
              .join('')
      }
    `;

    mountShell(root, {
      role: 'doctor',
      activePath: '#/doctor/schedule',
      contentHtml: content,
    });

    root.querySelectorAll('[data-date]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedDate = btn.getAttribute('data-date');
        paint();
      });
    });

    root.querySelectorAll('[data-confirm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        try {
          confirmAppointment(btn.getAttribute('data-confirm'));
          paint();
        } catch (err) {
          window.alert(err.message);
        }
      });
    });

    bindCancelActions(root, { onDone: paint });

    root.querySelectorAll('[data-join]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setVideoSession({
          appointmentId: btn.getAttribute('data-join'),
          role: 'doctor',
          uid: 2,
        });
        navigate('#/video');
      });
    });
  };

  paint();
  unsub = subscribe(() => paint());
  return () => unsub && unsub();
}
