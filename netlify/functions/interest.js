/**
 * Interest API — email upsert (mirrors ido join-waitlist shape).
 * Mounted on the shared Express app via backend/app.js OR standalone Netlify function.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEAM_INBOX = 'contact@yourhealthmatch.de';

/** In-memory store for serverless demo (ephemeral). */
const store = new Map();

function interestText(record) {
  const req = record.requirements || {};
  const firstVisit =
    req.newPatient === true ? 'Yes, first visit' : req.newPatient === false ? 'Already a patient' : '';
  return [
    `From: ${record.email}`,
    `Concern: ${record.symptomLabel || record.symptomId || ''}`,
    `Language: ${req.language || ''}`,
    `Place: ${[req.location || req.city, req.postcode].filter(Boolean).join(' ')}`,
    `Insurance: ${req.insurance || ''}`,
    `Krankenkasse: ${req.krankenkasse || ''}`,
    `First visit: ${firstVisit}`,
    `Visit type: ${req.modality || ''}`,
    `Times: ${req.preferredWindow || ''}`,
    `Note: ${record.note || ''}`
  ].join('\n');
}

async function storeInSupabase(record) {
  const base = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) return false;
  const req = record.requirements || {};
  try {
    const response = await fetch(`${base}/rest/v1/match_interest`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        email: record.email,
        symptom_id: record.symptomId || null,
        symptom_label: record.symptomLabel || record.note || '',
        language: req.language || '',
        location: req.location || req.city || '',
        postcode: req.postcode || '',
        insurance: req.insurance || '',
        krankenkasse: req.krankenkasse || '',
        new_patient: req.newPatient,
        modality: req.modality || '',
        preferred_window: req.preferredWindow || '',
        notify: TEAM_INBOX
      })
    });
    return response.ok || response.status === 409;
  } catch {
    return false;
  }
}

async function emailTeam(record) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [TEAM_INBOX],
        reply_to: record.email,
        subject: `Match interest: ${record.symptomLabel || record.symptomId || 'no opening'}`,
        text: interestText(record)
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function handler(event) {
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
      const [stored, emailed] = await Promise.all([storeInSupabase(record), emailTeam(record)]);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, emailed, stored, interest: record })
      };
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
}
