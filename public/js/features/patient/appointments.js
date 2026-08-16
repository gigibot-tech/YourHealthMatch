import { openBookModal } from './book-modal.js';
import { mountShell } from '../shell.js';
import { navigate } from '../../router.js';
import {
  getUpcomingForPatient,
  getDoctor,
  formatApptDate,
  formatTime,
  setVideoSession,
  rescheduleAppointment,
  availableSlots,
  subscribe,
} from '../../store/appointments.js';

function badge(status) {
  const cls = status === 'confirmed' ? 'badge-confirmed' : status === 'pending' ? 'badge-pending' : 'badge-completed';
  return `<span class="badge ${cls}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

function detailsHtml(a, doc) {
  return `
    <div class="modal-backdrop" id="details-modal">
      <div class="modal">
        <h2>Appointment details</h2>
        <p><strong>${doc?.name || ''}</strong> · ${doc?.specialty || ''}</p>
        <p class="detail" style="margin:0.5rem 0;color:var(--color-text-muted)">${formatApptDate(a.date)} at ${formatTime(a.time)}</p>
        <p class="detail" style="color:var(--color-text-muted)">${a.location}</p>
        <p style="margin-top:0.75rem">${a.reason}</p>
        <p style="margin-top:0.5rem">${badge(a.status)}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="close-details">Close</button>
          ${
            a.status === 'confirmed'
              ? `<button type="button" class="btn btn-primary" data-join-detail="${a.id}">Join Video</button>`
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

function rescheduleHtml(a) {
  const slots = availableSlots(a.doctorId, a.date);
  return `
    <div class="modal-backdrop" id="reschedule-modal">
      <div class="modal">
        <h2>Reschedule</h2>
        <div class="form-group">
          <label for="rs-date">Date</label>
          <input type="date" id="rs-date" value="${a.date}" />
        </div>
        <div class="form-group">
          <label>Time</label>
          <div class="slot-grid" id="rs-slots">
            ${slots.map((s) => `<button type="button" class="slot-btn" data-slot="${s}">${s}</button>`).join('') || '<span style="color:var(--color-text-muted)">No slots — pick another date</span>'}
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="close-rs">Cancel</button>
          <button type="button" class="btn btn-primary" id="save-rs" disabled>Save</button>
        </div>
      </div>
    </div>
  `;
}

export function mountPatientAppointments(root) {
  let unsub = null;

  const paint = () => {
    const list = getUpcomingForPatient();
    const content = `
      <div class="page-header">
        <div>
          <h1>Appointments</h1>
          <p class="sub">Manage your upcoming visits.</p>
        </div>
        <button type="button" class="btn btn-primary" id="book-btn">Book New Appointment</button>
      </div>
      <div id="appt-list">
        ${
          list.length === 0
            ? `<div class="empty-state">No upcoming appointments. Book your first visit.</div>`
            : list
                .map((a) => {
                  const doc = getDoctor(a.doctorId);
                  return `
              <div class="card appt-card">
                <div class="meta">
                  <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
                    <h3>${doc?.name || 'Doctor'}</h3>
                    ${badge(a.status)}
                  </div>
                  <div class="detail">${doc?.specialty || ''}</div>
                  <div class="detail">${formatApptDate(a.date)} at ${formatTime(a.time)}</div>
                  <div class="detail">${a.location}</div>
                </div>
                <div class="appt-actions">
                  <button type="button" class="btn btn-ghost btn-sm" data-reschedule="${a.id}">Reschedule</button>
                  <button type="button" class="btn btn-primary btn-sm" data-details="${a.id}">View Details</button>
                  ${
                    a.status === 'confirmed'
                      ? `<button type="button" class="btn btn-primary btn-sm" data-join="${a.id}">Join Video</button>`
                      : ''
                  }
                </div>
              </div>`;
                })
                .join('')
        }
      </div>
      <div id="modal-host"></div>
    `;

    mountShell(root, {
      role: 'patient',
      activePath: '#/patient/appointments',
      contentHtml: content,
    });

    root.querySelector('#book-btn')?.addEventListener('click', () => {
      openBookModal(root.querySelector('#modal-host'), { onDone: paint });
    });

    root.querySelectorAll('[data-join]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setVideoSession({ appointmentId: btn.getAttribute('data-join'), role: 'patient', uid: 1 });
        navigate('#/video');
      });
    });

    root.querySelectorAll('[data-details]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-details');
        const a = list.find((x) => x.id === id);
        const doc = getDoctor(a.doctorId);
        const host = root.querySelector('#modal-host');
        host.innerHTML = detailsHtml(a, doc);
        host.querySelector('#close-details')?.addEventListener('click', () => {
          host.innerHTML = '';
        });
        host.querySelector('[data-join-detail]')?.addEventListener('click', () => {
          setVideoSession({ appointmentId: id, role: 'patient', uid: 1 });
          navigate('#/video');
        });
      });
    });

    root.querySelectorAll('[data-reschedule]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-reschedule');
        const a = list.find((x) => x.id === id);
        const host = root.querySelector('#modal-host');
        let selectedSlot = null;

        const renderRs = (date) => {
          const slots = availableSlots(a.doctorId, date);
          host.innerHTML = rescheduleHtml({ ...a, date });
          const dateInput = host.querySelector('#rs-date');
          dateInput.value = date;
          dateInput.addEventListener('change', () => renderRs(dateInput.value));

          host.querySelectorAll('[data-slot]').forEach((s) => {
            s.addEventListener('click', () => {
              selectedSlot = s.getAttribute('data-slot');
              host.querySelectorAll('[data-slot]').forEach((x) => x.classList.remove('selected'));
              s.classList.add('selected');
              host.querySelector('#save-rs').disabled = false;
            });
          });

          host.querySelector('#close-rs')?.addEventListener('click', () => {
            host.innerHTML = '';
          });
          host.querySelector('#save-rs')?.addEventListener('click', () => {
            if (!selectedSlot) return;
            try {
              rescheduleAppointment(id, { date: dateInput.value, time: selectedSlot });
              host.innerHTML = '';
              paint();
            } catch (err) {
              alert(err.message);
            }
          });
        };

        renderRs(a.date);
      });
    });
  };

  paint();
  unsub = subscribe(() => paint());
  return () => unsub && unsub();
}
