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

function badge(status) {
  const cls = status === 'confirmed' ? 'badge-confirmed' : status === 'pending' ? 'badge-pending' : 'badge-completed';
  return `<span class="badge ${cls}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

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
          <p class="sub">${doctor.name} · clinic calendar</p>
        </div>
      </div>
      <div class="date-strip">
        ${strip
          .map(
            (d) => `
          <button type="button" class="date-chip${d.iso === selectedDate ? ' active' : ''}" data-date="${d.iso}">
            <div class="day">${d.day}</div>
            <div class="num">${d.dateNum}</div>
          </button>`
          )
          .join('')}
      </div>
      <h2 class="section-title">${strip.find((d) => d.iso === selectedDate)?.label || selectedDate}</h2>
      ${
        list.length === 0
          ? `<div class="empty-state">No appointments this day.</div>`
          : list
              .map(
                (a) => `
            <div class="card appt-card">
              <div class="meta">
                <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
                  <h3>${a.patientName}</h3>
                  ${badge(a.status)}
                </div>
                <div class="detail">${formatTime(a.time)} · ${a.reason}</div>
                <div class="detail">${a.location}</div>
              </div>
              <div class="appt-actions">
                ${
                  a.status === 'pending'
                    ? `<button type="button" class="btn btn-primary btn-sm" data-confirm="${a.id}">Confirm</button>`
                    : a.status === 'confirmed'
                      ? `<button type="button" class="btn btn-primary btn-sm" data-join="${a.id}">Join Video</button>`
                      : ''
                }
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
        confirmAppointment(btn.getAttribute('data-confirm'));
        paint();
      });
    });

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
