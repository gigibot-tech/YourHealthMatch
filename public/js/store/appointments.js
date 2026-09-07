/**
 * Shared appointment store — single source of truth for patient + doctor.
 */

import { assertCanChangeSchedule } from '../domain/cancellation.js';

const STORAGE_KEY = 'yhm_appointments_v1';
const ROLE_KEY = 'yhm_role';
const SESSION_KEY = 'yhm_session';

const DOCTORS = [
  {
    id: 'doc_johnson',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    location: 'Building A, Room 305',
  },
  {
    id: 'doc_chen',
    name: 'Dr. Michael Chen',
    specialty: 'Dermatologist',
    location: 'Building B, Room 102',
  },
  {
    id: 'doc_davis',
    name: 'Dr. Emily Davis',
    specialty: 'General Practitioner',
    location: 'Building A, Room 201',
  },
  {
    id: 'doc_turner',
    name: 'Dr. Olivia Turner, M.D.',
    specialty: 'Ophthalmology',
    location: 'Building C, Room 110',
  },
];

const PATIENT = {
  id: 'pat_john',
  name: 'John Doe',
  shortName: 'John',
};

/** Active doctor when using doctor role (demo: Turner owns today's queue). */
const ACTIVE_DOCTOR_ID = 'doc_turner';

const OPEN_STATUSES = new Set(['pending', 'confirmed']);

const listeners = new Set();

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Local calendar date (not UTC) so the 6-hour cutoff matches the wall clock. */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'completed', 'cancelled']);
const APPOINTMENT_ID_RE = /^appt_[A-Za-z0-9_]+$/;

function seedAppointments() {
  const t = todayISO();
  return [
    {
      id: 'appt_seed_1',
      doctorId: 'doc_johnson',
      patientId: PATIENT.id,
      patientName: PATIENT.name,
      reason: 'Cardiology follow-up',
      date: addDaysISO(2),
      time: '10:00',
      location: 'Building A, Room 305',
      status: 'confirmed',
      channel: 'appt_appt_seed_1',
    },
    {
      id: 'appt_seed_2',
      doctorId: 'doc_chen',
      patientId: PATIENT.id,
      patientName: PATIENT.name,
      reason: 'Skin check',
      date: addDaysISO(5),
      time: '14:30',
      location: 'Building B, Room 102',
      status: 'confirmed',
      channel: 'appt_appt_seed_2',
    },
    {
      id: 'appt_seed_3',
      doctorId: 'doc_davis',
      patientId: PATIENT.id,
      patientName: PATIENT.name,
      reason: 'Annual checkup',
      date: addDaysISO(8),
      time: '09:00',
      location: 'Building A, Room 201',
      status: 'pending',
      channel: 'appt_appt_seed_3',
    },
    {
      id: 'appt_today_1',
      doctorId: ACTIVE_DOCTOR_ID,
      patientId: PATIENT.id,
      patientName: PATIENT.name,
      reason: 'Examination for eyesight',
      date: t,
      time: '10:00',
      location: 'Building C, Room 110',
      status: 'confirmed',
      channel: 'appt_appt_today_1',
    },
    {
      id: 'appt_today_2',
      doctorId: ACTIVE_DOCTOR_ID,
      patientId: 'pat_maria',
      patientName: 'Maria Lopez',
      reason: 'Post-op review',
      date: t,
      time: '11:00',
      location: 'Building C, Room 110',
      status: 'confirmed',
      channel: 'appt_appt_today_2',
    },
    {
      id: 'appt_today_3',
      doctorId: ACTIVE_DOCTOR_ID,
      patientId: 'pat_alex',
      patientName: 'Alex Kim',
      reason: 'Vision screening',
      date: t,
      time: '14:00',
      location: 'Building C, Room 110',
      status: 'pending',
      channel: 'appt_appt_today_3',
    },
  ];
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (a) =>
        a &&
        typeof a.id === 'string' &&
        APPOINTMENT_ID_RE.test(a.id) &&
        ALLOWED_STATUSES.has(a.status) &&
        /^\d{4}-\d{2}-\d{2}$/.test(a.date || '') &&
        /^\d{2}:\d{2}$/.test(a.time || '')
    );
  } catch {
    return null;
  }
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  listeners.forEach((fn) => {
    try {
      fn(list);
    } catch (e) {
      console.error(e);
    }
  });
}

function ensureSeeded() {
  let list = loadRaw();
  if (!list || !Array.isArray(list) || list.length === 0) {
    list = seedAppointments();
    save(list);
  }
  return list;
}

export function initStore() {
  return ensureSeeded();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getDoctors() {
  return DOCTORS.slice();
}

export function getDoctor(id) {
  return DOCTORS.find((d) => d.id === id) || null;
}

export function getActiveDoctor() {
  return getDoctor(ACTIVE_DOCTOR_ID);
}

export function getPatient() {
  return { ...PATIENT };
}

export function getAppointments() {
  return ensureSeeded().slice();
}

export function getAppointment(id) {
  return ensureSeeded().find((a) => a.id === id) || null;
}

export function getUpcomingForPatient(patientId = PATIENT.id) {
  const today = todayISO();
  return ensureSeeded()
    .filter((a) => a.patientId === patientId && a.date >= today && OPEN_STATUSES.has(a.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function getForDoctorOnDate(doctorId, date) {
  return ensureSeeded()
    .filter((a) => a.doctorId === doctorId && a.date === date && OPEN_STATUSES.has(a.status))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getPendingForDoctor(doctorId) {
  return ensureSeeded()
    .filter((a) => a.doctorId === doctorId && a.status === 'pending')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function channelFor(appointmentId) {
  return `appt_${appointmentId}`;
}

export function bookAppointment({ doctorId, date, time, reason }) {
  const doctor = getDoctor(doctorId);
  if (!doctor) throw new Error('Doctor not found');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Invalid date or time.');
  }
  const cleanReason = String(reason || 'Consultation').trim().slice(0, 120);
  if (!cleanReason) throw new Error('Reason is required.');

  const list = ensureSeeded();
  const clash = list.some(
    (a) => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== 'cancelled'
  );
  if (clash) throw new Error('That slot is already booked');

  const id = `appt_${Date.now()}`;
  const appt = {
    id,
    doctorId,
    patientId: PATIENT.id,
    patientName: PATIENT.name,
    reason: cleanReason,
    date,
    time,
    location: doctor.location,
    status: 'pending',
    channel: channelFor(id),
  };
  list.push(appt);
  save(list);
  return appt;
}

function requireActorRole() {
  const actorRole = getRole();
  if (actorRole !== 'patient' && actorRole !== 'doctor') {
    throw new Error('Not allowed.');
  }
  return actorRole;
}

function assertActorOwnsAppointment(appt, actorRole) {
  if (actorRole === 'patient') {
    if (appt.patientId !== PATIENT.id) {
      throw new Error('You can only change your own appointments.');
    }
    return;
  }
  if (actorRole === 'doctor') {
    if (appt.doctorId !== ACTIVE_DOCTOR_ID) {
      throw new Error('You can only change visits on your schedule.');
    }
    return;
  }
  throw new Error('Not allowed.');
}

function findOpenAppointment(list, id) {
  if (!APPOINTMENT_ID_RE.test(id || '')) throw new Error('Appointment not found');
  const appt = list.find((a) => a.id === id);
  if (!appt) throw new Error('Appointment not found');
  return appt;
}

export function confirmAppointment(id) {
  if (requireActorRole() !== 'doctor') {
    throw new Error('Only the assigned doctor can confirm a visit.');
  }
  const list = ensureSeeded();
  const appt = findOpenAppointment(list, id);
  if (appt.doctorId !== ACTIVE_DOCTOR_ID) {
    throw new Error('You can only confirm visits on your schedule.');
  }
  if (appt.status !== 'pending') {
    throw new Error('Only pending appointments can be confirmed.');
  }
  appt.status = 'confirmed';
  save(list);
  return appt;
}

export function cancelAppointment(id, { now = Date.now() } = {}) {
  const actorRole = requireActorRole();
  const list = ensureSeeded();
  const appt = findOpenAppointment(list, id);
  assertActorOwnsAppointment(appt, actorRole);
  assertCanChangeSchedule(appt, now);
  appt.status = 'cancelled';
  appt.cancelledAt = new Date(now).toISOString();
  appt.cancelledBy = actorRole;
  save(list);
  return appt;
}

export function rescheduleAppointment(id, { date, time }) {
  const actorRole = requireActorRole();
  const list = ensureSeeded();
  const appt = findOpenAppointment(list, id);
  assertActorOwnsAppointment(appt, actorRole);
  assertCanChangeSchedule(appt);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Invalid date or time.');
  }

  const clash = list.some(
    (a) =>
      a.id !== id &&
      a.doctorId === appt.doctorId &&
      a.date === date &&
      a.time === time &&
      a.status !== 'cancelled'
  );
  if (clash) throw new Error('That slot is already booked');

  appt.date = date;
  appt.time = time;
  appt.status = 'pending';
  save(list);
  return appt;
}

export function markCompleted(id) {
  const list = ensureSeeded();
  const appt = list.find((a) => a.id === id);
  if (!appt) throw new Error('Appointment not found');
  appt.status = 'completed';
  save(list);
  return appt;
}

export function availableSlots(doctorId, date) {
  const hours = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
  const taken = new Set(
    ensureSeeded()
      .filter((a) => a.doctorId === doctorId && a.date === date && a.status !== 'cancelled')
      .map((a) => a.time)
  );
  return hours.filter((h) => !taken.has(h));
}

export function todayISODate() {
  return todayISO();
}

export function dateStrip(days = 7) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      iso: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    });
  }
  return out;
}

export function formatApptDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(time) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function setRole(role) {
  if (role !== 'patient' && role !== 'doctor') return;
  localStorage.setItem(ROLE_KEY, role);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function clearRole() {
  localStorage.removeItem(ROLE_KEY);
}

export function setVideoSession(payload) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function getVideoSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearVideoSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  return ensureSeeded();
}

export { DOCTORS, PATIENT, ACTIVE_DOCTOR_ID };
