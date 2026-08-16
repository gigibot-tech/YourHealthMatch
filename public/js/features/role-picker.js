import { navigate } from '../router.js';
import { setRole } from '../store/appointments.js';

export function mountRolePicker(root) {
  root.innerHTML = `
    <div id="role-picker">
      <div class="role-card-wrap">
        <h1>Who is signing in?</h1>
        <p>Choose a role for this demo session. Appointments are shared so both sides stay in sync.</p>
        <div class="role-grid">
          <button type="button" class="role-choice" data-role="patient">
            <div class="role-icon" aria-hidden="true">🧑‍💼</div>
            <strong>Patient</strong>
            <span>Book visits, view history, join video</span>
          </button>
          <button type="button" class="role-choice" data-role="doctor">
            <div class="role-icon" aria-hidden="true">🩺</div>
            <strong>Doctor</strong>
            <span>Today’s queue, confirm, join calls</span>
          </button>
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-role]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      setRole(role);
      navigate(role === 'doctor' ? '#/doctor/dashboard' : '#/patient/dashboard');
    });
  });
}
