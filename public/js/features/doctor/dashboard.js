import { mountShell } from '../shell.js';
import { navigate } from '../../router.js';
import {
  getActiveDoctor,
  getForDoctorOnDate,
  getPendingForDoctor,
  todayISODate,
  formatTime,
  greeting,
  confirmAppointment,
  setVideoSession,
  subscribe,
} from '../../store/appointments.js';

const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

function badge(status) {
  const cls = status === 'confirmed' ? 'badge-confirmed' : status === 'pending' ? 'badge-pending' : 'badge-completed';
  return `<span class="badge ${cls}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

function hourKey(time) {
  return `${time.slice(0, 2)}:00`;
}

function render(today) {
  const doctor = getActiveDoctor();
  const todays = getForDoctorOnDate(doctor.id, today);
  const pending = getPendingForDoctor(doctor.id);
  const confirmedToday = todays.filter((a) => a.status === 'confirmed');
  const completedToday = todays.filter((a) => a.status === 'completed');
  const next = confirmedToday.find((a) => a.status === 'confirmed') || todays[0] || null;
  const nextTime = next ? formatTime(next.time) : '—';

  const byHour = {};
  todays.forEach((a) => {
    const h = hourKey(a.time);
    if (!byHour[h]) byHour[h] = [];
    byHour[h].push(a);
  });

  return `
    <div class="page-header">
      <div>
        <h1>${greeting()}, ${doctor.name.replace(', M.D.', '')}</h1>
        <p class="sub">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Today’s clinic</p>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-icon blue">🗓️</div>
        <div><div class="label">Today’s visits</div><div class="value">${todays.length}</div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon orange">⏳</div>
        <div><div class="label">Pending</div><div class="value">${pending.length}</div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">✅</div>
        <div><div class="label">Completed</div><div class="value">${completedToday.length}</div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon purple">⏰</div>
        <div><div class="label">Next start</div><div class="value" style="font-size:1.1rem">${nextTime}</div></div>
      </div>
    </div>

    ${
      pending.length
        ? `<div class="pending-strip">
            ${pending
              .map(
                (a) => `
              <div class="pending-chip">
                <span><strong>${a.patientName}</strong> · ${formatTime(a.time)} · ${a.reason}</span>
                <button type="button" class="btn btn-primary btn-sm" data-confirm="${a.id}">Confirm</button>
              </div>`
              )
              .join('')}
          </div>`
        : ''
    }

    ${
      next
        ? `<div class="next-patient">
            <div class="eyebrow">Next patient</div>
            <h2>${next.patientName}</h2>
            <p class="reason">${next.reason} · ${formatTime(next.time)}</p>
            <div class="row">
              ${badge(next.status)}
              <div class="appt-actions">
                ${
                  next.status === 'pending'
                    ? `<button type="button" class="btn btn-primary" data-confirm="${next.id}">Confirm visit</button>`
                    : `<button type="button" class="btn btn-primary" data-join="${next.id}">Join Video Call</button>`
                }
              </div>
            </div>
          </div>`
        : `<div class="next-patient empty"><div class="eyebrow">Next patient</div><h2>No visits scheduled today</h2></div>`
    }

    <div class="doctor-layout">
      <div class="timeline">
        <h2 class="section-title">Today’s timeline</h2>
        ${HOURS.map((h) => {
          const items = byHour[h] || [];
          return `
            <div class="timeline-row">
              <div class="timeline-hour">${formatTime(h)}</div>
              <div class="timeline-slot">
                ${items
                  .map(
                    (a) => `
                  <button type="button" class="timeline-chip${a.status === 'pending' ? ' pending' : ''}" data-join-or-view="${a.id}" data-status="${a.status}">
                    <strong>${a.patientName}</strong>
                    ${a.reason} · ${formatTime(a.time)}
                  </button>`
                  )
                  .join('')}
              </div>
            </div>`;
        }).join('')}
      </div>

      <aside class="queue-panel">
        <h3>Queue</h3>
        ${
          todays.length === 0
            ? `<p style="color:var(--color-text-muted);font-size:0.875rem">No patients in queue.</p>`
            : todays
                .map(
                  (a) => `
              <div class="queue-item">
                <div class="name">${a.patientName} ${badge(a.status)}</div>
                <div class="info">${formatTime(a.time)} · ${a.reason}</div>
                <div class="appt-actions">
                  ${
                    a.status === 'pending'
                      ? `<button type="button" class="btn btn-primary btn-sm" data-confirm="${a.id}">Confirm</button>`
                      : a.status === 'confirmed'
                        ? `<button type="button" class="btn btn-primary btn-sm" data-join="${a.id}">Join</button>`
                        : ''
                  }
                </div>
              </div>`
                )
                .join('')
        }
      </aside>
    </div>
  `;
}

export function mountDoctorDashboard(root) {
  const today = todayISODate();
  let unsub = null;

  const paint = () => {
    mountShell(root, {
      role: 'doctor',
      activePath: '#/doctor/dashboard',
      contentHtml: render(today),
    });

    root.querySelectorAll('[data-confirm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        confirmAppointment(btn.getAttribute('data-confirm'));
        paint();
      });
    });

    const join = (id) => {
      setVideoSession({ appointmentId: id, role: 'doctor', uid: 2 });
      navigate('#/video');
    };

    root.querySelectorAll('[data-join]').forEach((btn) => {
      btn.addEventListener('click', () => join(btn.getAttribute('data-join')));
    });

    root.querySelectorAll('[data-join-or-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-join-or-view');
        const status = btn.getAttribute('data-status');
        if (status === 'pending') {
          confirmAppointment(id);
          paint();
        } else if (status === 'confirmed') {
          join(id);
        }
      });
    });
  };

  paint();
  unsub = subscribe(() => paint());
  return () => unsub && unsub();
}
