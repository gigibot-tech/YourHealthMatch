/**
 * Interest API — email upsert (mirrors ido join-waitlist shape).
 * Mounted on the shared Express app via backend/app.js OR standalone Netlify function.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** In-memory store for serverless demo (ephemeral). */
const store = new Map();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      }
    };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!EMAIL_RE.test(email) || email.length > 254) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email' }) };
      }
      const existing = store.get(email) || {};
      const record = {
        ...existing,
        ...body,
        email,
        updatedAt: new Date().toISOString()
      };
      store.set(email, record);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, interest: record }) };
    }

    if (event.httpMethod === 'GET') {
      const all = [...store.values()];
      const practiceId = event.queryStringParameters?.practiceId;
      const filtered = practiceId ? all.filter((i) => i.practiceId === practiceId) : all;
      const buckets = new Map();
      for (const i of filtered) {
        const req = i.requirements || {};
        const specialty = req.specialty || 'any';
        const language = req.language || 'any';
        const location = req.location || req.city || 'any';
        const key = `${specialty}|${language}|${location}`;
        const cur = buckets.get(key) || { specialty, language, location, count: 0 };
        cur.count += 1;
        buckets.set(key, cur);
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ demand: [...buckets.values()], total: filtered.length })
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
