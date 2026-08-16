/**
 * Hash router: #/splash, #/role, #/patient/..., #/doctor/..., #/video
 */

const routes = new Map();
let current = null;

export function register(path, handler) {
  routes.set(path, handler);
}

export function navigate(path) {
  if (!path.startsWith('#/')) {
    path = `#/${path.replace(/^\//, '')}`;
  }
  if (location.hash === path) {
    dispatch();
    return;
  }
  location.hash = path;
}

export function currentPath() {
  const hash = location.hash || '#/splash';
  return hash.replace(/^#/, '') || '/splash';
}

function match(path) {
  if (routes.has(path)) return { handler: routes.get(path), params: {} };

  for (const [pattern, handler] of routes) {
    const keys = [];
    const re = new RegExp(
      `^${pattern.replace(/:([A-Za-z]+)/g, (_, k) => {
        keys.push(k);
        return '([^/]+)';
      })}$`
    );
    const m = path.match(re);
    if (m) {
      const params = {};
      keys.forEach((k, i) => {
        params[k] = decodeURIComponent(m[i + 1]);
      });
      return { handler, params };
    }
  }
  return null;
}

export function dispatch() {
  const path = currentPath();
  const matched = match(path) || match('/splash');
  if (!matched) return;
  current = path;
  matched.handler(matched.params || {});
}

export function start() {
  window.addEventListener('hashchange', dispatch);
  if (!location.hash) {
    location.hash = '#/splash';
  } else {
    dispatch();
  }
}

export function getCurrent() {
  return current;
}
