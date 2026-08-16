import { mountShell } from '../shell.js';
import { navigate } from '../../router.js';
import {
  getPatient,
  getUpcomingForPatient,
  getDoctor,
  formatApptDate,
  formatTime,
  dateStrip,
  todayISODate,
  greeting,
  setVideoSession,
  subscribe,
} from '../../store/appointments.js';

function badge(status) {
  const cls = status === 'confirmed' ? 'badge-confirmed' : status === 'pending' ? 'badge-pending' : 'badge-completed';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="badge ${cls}">${label}</span>`;
}

function renderContent(selectedDate) {
  const patient = getPatient();
  const upcoming = getUpcomingForPatient();
  const strip = dateStrip(7);
  const dayAppts = upcoming.filter((a) => a.date === selectedDate);
  const confirmed = upcoming.filter((a) => a.status === 'confirmed').length;
  const pending = upcoming.filter((a) => a.status === 'pending').length;

  return `
    <div class="welcome-row">
      <div class="avatar">${patient.shortName.slice(0, 1)}</div>
      <div>
        <h1 style="font-size:1.35rem;font-weight:700">${greeting()}, ${patient.shortName}</h1>
        <p class="sub">Here's your health overview.</p>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-icon blue">📅</div>
        <div><div class="label">Upcoming</div><div class="value">${upcoming.length}</div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">📹</div>
        <div><div class="label">Video ready</div><div class="value">${confirmed}</div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon purple">📄</div>
        <div><div class="label">Records</div><div class="value">12</div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon orange">🏥</div>
        <div><div class="label">Past visits</div><div class="value">18</div></div>
      </div>
    </div>

    <div class="date-strip" id="date-strip">
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
    <div id="day-list">
      ${
        dayAppts.length === 0
          ? `<div class="empty-state">No appointments on this day.</div>`
          : dayAppts
              .map((a) => {
                const doc = getDoctor(a.doctorId);
                return `
            <div class="card appt-card">
              <div class="meta">
                <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
                  <h3>${doc?.name || 'Doctor'}</h3>
                  ${badge(a.status)}
                </div>
                <div class="detail">${doc?.specialty || ''} · ${formatTime(a.time)}</div>
                <div class="detail">${a.reason}</div>
              </div>
              <div class="appt-actions">
                ${
                  a.status === 'confirmed'
                    ? `<button type="button" class="btn btn-primary btn-sm" data-join="${a.id}">Join Video</button>`
                    : `<button type="button" class="btn btn-ghost btn-sm" disabled>Awaiting confirm</button>`
                }
              </div>
            </div>`;
              })
              .join('')
      }
    </div>

    <h2 class="section-title" style="margin-top:1.75rem">Upcoming appointments</h2>
    <div>
      ${upcoming
        .slice(0, 4)
        .map((a) => {
          const doc = getDoctor(a.doctorId);
          return `
          <div class="card appt-card">
            <div class="meta">
              <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
                <h3>${doc?.name || 'Doctor'}</h3>
                ${badge(a.status)}
              </div>
              <div class="detail">${formatApptDate(a.date)} at ${formatTime(a.time)}</div>
              <div class="detail">${a.location}</div>
            </div>
            <div class="appt-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-goto-appts>View</button>
            </div>
          </div>`;
        })
        .join('')}
    </div>
  `;
}

export function mountPatientDashboard(root) {
  let selectedDate = todayISODate();
  let unsub = null;

  const paint = () => {
    mountShell(root, {
      role: 'patient',
      activePath: '#/patient/dashboard',
      contentHtml: renderContent(selectedDate),
    });

    root.querySelectorAll('[data-date]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedDate = btn.getAttribute('data-date');
        paint();
      });
    });

    root.querySelectorAll('[data-join]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setVideoSession({
          appointmentId: btn.getAttribute('data-join'),
          role: 'patient',
          uid: 1,
        });
        navigate('#/video');
      });
    });

    root.querySelectorAll('[data-goto-appts]').forEach((btn) => {
      btn.addEventListener('click', () => navigate('#/patient/appointments'));
    });
  };

  paint();
  unsub = subscribe(() => paint());
  return () => unsub && unsub();
}
