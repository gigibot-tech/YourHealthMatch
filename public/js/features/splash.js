import { navigate } from '../router.js';

const LOGO_SVG = `<svg class="splash-logo" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="8" y="8" width="80" height="80" rx="18" fill="white"/>
  <path d="M42 28h12v16h16v12H54v16H42V56H26V44h16V28z" fill="#1e4fd6"/>
  <path d="M28 68c12-18 28-18 40 0" stroke="#1e4fd6" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>`;

export function mountSplash(root) {
  root.innerHTML = `
    <div id="splash">
      ${LOGO_SVG}
      <div class="splash-title">YourHealthMatch</div>
      <p class="splash-sub">Care that connects you</p>
      <button type="button" class="splash-btn" id="splash-continue">Continue</button>
    </div>
  `;

  const go = () => navigate('#/role');
  root.querySelector('#splash-continue').addEventListener('click', go);

  const timer = setTimeout(go, 1600);
  return () => clearTimeout(timer);
}
