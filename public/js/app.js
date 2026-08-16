import { initStore, getRole } from './store/appointments.js';
import { register, start, navigate } from './router.js';
import { mountSplash } from './features/splash.js';
import { mountRolePicker } from './features/role-picker.js';
import { mountPatientDashboard } from './features/patient/dashboard.js';
import { mountPatientAppointments } from './features/patient/appointments.js';
import { mountPatientStub } from './features/patient/stubs.js';
import { mountDoctorDashboard } from './features/doctor/dashboard.js';
import { mountDoctorSchedule } from './features/doctor/schedule.js';
import { mountDoctorStub } from './features/doctor/stubs.js';
import { mountVideoCall } from './features/video/agora-call.js';

const root = document.getElementById('app');
let teardown = null;

async function show(mountFn, ...args) {
  if (typeof teardown === 'function') {
    const result = teardown();
    if (result && typeof result.then === 'function') await result;
  }
  teardown = mountFn(root, ...args) || null;
}

function requireRole(role, fallback) {
  const current = getRole();
  if (current !== role) {
    navigate(fallback || '#/role');
    return false;
  }
  return true;
}

export function boot() {
  initStore();

  register('/splash', () => show(mountSplash));
  register('/role', () => show(mountRolePicker));

  register('/patient/dashboard', () => {
    if (!requireRole('patient')) return;
    show(mountPatientDashboard);
  });
  register('/patient/appointments', () => {
    if (!requireRole('patient')) return;
    show(mountPatientAppointments);
  });
  register('/patient/history', () => {
    if (!requireRole('patient')) return;
    show(mountPatientStub, '#/patient/history', 'Medical History');
  });
  register('/patient/documents', () => {
    if (!requireRole('patient')) return;
    show(mountPatientStub, '#/patient/documents', 'Documents');
  });
  register('/patient/insurance', () => {
    if (!requireRole('patient')) return;
    show(mountPatientStub, '#/patient/insurance', 'Insurance');
  });
  register('/patient/profile', () => {
    if (!requireRole('patient')) return;
    show(mountPatientStub, '#/patient/profile', 'Profile');
  });
  register('/patient/download', () => {
    if (!requireRole('patient')) return;
    show(mountPatientStub, '#/patient/download', 'Download Records');
  });

  register('/doctor/dashboard', () => {
    if (!requireRole('doctor')) return;
    show(mountDoctorDashboard);
  });
  register('/doctor/schedule', () => {
    if (!requireRole('doctor')) return;
    show(mountDoctorSchedule);
  });
  register('/doctor/patients', () => {
    if (!requireRole('doctor')) return;
    show(mountDoctorStub, '#/doctor/patients', 'Patients');
  });
  register('/doctor/notes', () => {
    if (!requireRole('doctor')) return;
    show(mountDoctorStub, '#/doctor/notes', 'Notes');
  });
  register('/doctor/profile', () => {
    if (!requireRole('doctor')) return;
    show(mountDoctorStub, '#/doctor/profile', 'Profile');
  });

  register('/video', () => {
    const role = getRole();
    if (!role) {
      navigate('#/role');
      return;
    }
    show(mountVideoCall);
  });

  start();
}

boot();
