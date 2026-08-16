import {
  getDoctors,
  availableSlots,
  bookAppointment,
  todayISODate,
} from '../../store/appointments.js';

export function openBookModal(host, { onDone } = {}) {
  const doctors = getDoctors();
  let selectedSlot = null;
  let doctorId = doctors[0]?.id || '';
  let date = todayISODate();

  const paint = () => {
    const slots = doctorId ? availableSlots(doctorId, date) : [];
    host.innerHTML = `
      <div class="modal-backdrop" id="book-modal">
        <div class="modal">
          <h2>Book New Appointment</h2>
          <div class="form-group">
            <label for="bk-doctor">Doctor</label>
            <select id="bk-doctor">
              ${doctors
                .map(
                  (d) =>
                    `<option value="${d.id}" ${d.id === doctorId ? 'selected' : ''}>${d.name} — ${d.specialty}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="bk-date">Date</label>
            <input type="date" id="bk-date" value="${date}" min="${todayISODate()}" />
          </div>
          <div class="form-group">
            <label>Time slot</label>
            <div class="slot-grid" id="bk-slots">
              ${
                slots.length
                  ? slots
                      .map(
                        (s) =>
                          `<button type="button" class="slot-btn${s === selectedSlot ? ' selected' : ''}" data-slot="${s}">${s}</button>`
                      )
                      .join('')
                  : '<span style="color:var(--color-text-muted)">No open slots</span>'
              }
            </div>
          </div>
          <div class="form-group">
            <label for="bk-reason">Reason</label>
            <input type="text" id="bk-reason" placeholder="e.g. Follow-up consultation" value="Consultation" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" id="bk-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="bk-save" ${selectedSlot ? '' : 'disabled'}>Confirm booking</button>
          </div>
        </div>
      </div>
    `;

    host.querySelector('#bk-cancel')?.addEventListener('click', () => {
      host.innerHTML = '';
    });

    host.querySelector('#bk-doctor')?.addEventListener('change', (e) => {
      doctorId = e.target.value;
      selectedSlot = null;
      paint();
    });

    host.querySelector('#bk-date')?.addEventListener('change', (e) => {
      date = e.target.value;
      selectedSlot = null;
      paint();
    });

    host.querySelectorAll('[data-slot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedSlot = btn.getAttribute('data-slot');
        paint();
      });
    });

    host.querySelector('#bk-save')?.addEventListener('click', () => {
      if (!selectedSlot || !doctorId) return;
      const reason = host.querySelector('#bk-reason').value.trim() || 'Consultation';
      try {
        bookAppointment({ doctorId, date, time: selectedSlot, reason });
        host.innerHTML = '';
        onDone?.();
      } catch (err) {
        alert(err.message);
      }
    });
  };

  paint();
}
