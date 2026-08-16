import { navigate } from '../router.js';
import { clearRole } from '../store/appointments.js';

const BRAND = `
  <div class="brand">
    <svg class="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1e4fd6"/>
      <path d="M14 8h4v6h6v4h-6v6h-4v-6H8v-4h6V8z" fill="white"/>
    </svg>
    YourHealthMatch
  </div>
`;

function icon(name) {
  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    video: '<rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l5-3v10l-5-3z"/>',
    file: '<path d="M6 3h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5M5 21h14"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M15 20c0-2 1.5-3.5 4-4"/>',
    notes: '<path d="M5 4h11a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2z"/>',
    schedule: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
}

function navBtn(href, label, iconName, activePath) {
  const active = activePath === href ? ' active' : '';
  return `<button type="button" class="nav-link${active}" data-nav="${href}">${icon(iconName)} ${label}</button>`;
}

export function mountShell(root, { role, activePath, contentHtml }) {
  const patientNav = [
    navBtn('#/patient/dashboard', 'Dashboard', 'dashboard', activePath),
    navBtn('#/patient/appointments', 'Appointments', 'calendar', activePath),
    navBtn('#/video', 'Video Call', 'video', activePath),
    navBtn('#/patient/history', 'Medical History', 'file', activePath),
    navBtn('#/patient/documents', 'Documents', 'file', activePath),
    navBtn('#/patient/insurance', 'Insurance', 'shield', activePath),
    navBtn('#/patient/profile', 'Profile', 'user', activePath),
    navBtn('#/patient/download', 'Download Records', 'download', activePath),
  ].join('');

  const doctorNav = [
    navBtn('#/doctor/dashboard', 'Dashboard', 'dashboard', activePath),
    navBtn('#/doctor/schedule', 'Schedule', 'schedule', activePath),
    navBtn('#/video', 'Video Call', 'video', activePath),
    navBtn('#/doctor/patients', 'Patients', 'users', activePath),
    navBtn('#/doctor/notes', 'Notes', 'notes', activePath),
    navBtn('#/doctor/profile', 'Profile', 'user', activePath),
  ].join('');

  root.innerHTML = `
    <div class="mobile-bar">
      <strong>YourHealthMatch</strong>
      <button type="button" id="menu-toggle">Menu</button>
    </div>
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
    <div class="app-shell">
      <aside class="sidebar" id="app-sidebar">
        ${BRAND}
        <select class="lang-select" aria-label="Language">
          <option>English</option>
          <option>Deutsch</option>
        </select>
        <nav class="nav">${role === 'doctor' ? doctorNav : patientNav}</nav>
        <div class="sidebar-footer">
          <button type="button" class="nav-link" id="logout-btn">${icon('logout')} Logout</button>
        </div>
      </aside>
      <main class="main" id="main-content">${contentHtml}</main>
    </div>
  `;

  const sidebar = root.querySelector('#app-sidebar');
  const backdrop = root.querySelector('#sidebar-backdrop');
  const closeMenu = () => {
    sidebar.classList.remove('open');
    backdrop.classList.remove('visible');
  };

  root.querySelector('#menu-toggle')?.addEventListener('click', () => {
    sidebar.classList.add('open');
    backdrop.classList.add('visible');
  });
  backdrop?.addEventListener('click', closeMenu);

  root.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeMenu();
      navigate(btn.getAttribute('data-nav'));
    });
  });

  root.querySelector('#logout-btn')?.addEventListener('click', () => {
    clearRole();
    navigate('#/role');
  });

  return root.querySelector('#main-content');
}

export function stubPage(title, blurb) {
  return `
    <div class="page-header">
      <div>
        <h1>${title}</h1>
        <p class="sub">${blurb || 'This section is coming soon.'}</p>
      </div>
    </div>
    <div class="stub-panel">
      <h2>Coming soon</h2>
      <p>We’re focusing on appointments and video consults first.</p>
    </div>
  `;
}
