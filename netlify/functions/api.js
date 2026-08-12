const serverless = require('serverless-http');
const app = require('../../backend/app');

const handler = serverless(app);

/**
 * Netlify rewrites:
 *   /api/*  → /.netlify/functions/api/:splat
 *   /health → /.netlify/functions/api/health
 * Normalize so Express still sees /api/... and /health.
 */
exports.handler = async (event, context) => {
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    const rest = event.path.slice('/.netlify/functions/api'.length) || '';

    if (rest === '' || rest === '/') {
      event.path = '/health';
    } else if (rest === '/health' || rest.startsWith('/api')) {
      event.path = rest;
    } else {
      event.path = `/api${rest}`;
    }
  }

  return handler(event, context);
};
