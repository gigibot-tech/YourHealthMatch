/**
 * Express app for telemedicine video API (shared by local server + Netlify).
 */

const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();

const TOKEN_EXPIRY_SECONDS = () =>
  parseInt(process.env.TOKEN_EXPIRY_SECONDS || '3600', 10);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ephemeral on serverless — fine for demos; use a DB in production.
const sessions = new Map();

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    agoraConfigured: Boolean(process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE),
  });
});

app.post('/api/video/token', (req, res) => {
  try {
    const { appointmentId, channelName, uid = 0 } = req.body;
    const AGORA_APP_ID = process.env.AGORA_APP_ID;
    const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

    if (!appointmentId || !channelName) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['appointmentId', 'channelName'],
      });
    }

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      console.error('Agora credentials not configured');
      return res.status(500).json({
        error: 'Server configuration error',
      });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRY_SECONDS();

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    console.log(`Generated token for channel: ${channelName}, uid: ${uid}`);

    res.json({
      token,
      channelName,
      uid,
      expiresAt: new Date(privilegeExpiredTs * 1000).toISOString(),
      appId: AGORA_APP_ID,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      error: 'Failed to generate token',
      message: error.message,
    });
  }
});

app.post('/api/video/session/start', (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        error: 'Missing appointmentId',
      });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    sessions.set(sessionId, {
      sessionId,
      appointmentId,
      startTime: new Date().toISOString(),
      status: 'active',
    });

    console.log(`Started session: ${sessionId} for appointment: ${appointmentId}`);

    res.json({ sessionId });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      error: 'Failed to start session',
      message: error.message,
    });
  }
});

app.post('/api/video/session/end', (req, res) => {
  try {
    const { sessionId, duration, reason = 'normal' } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing sessionId',
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    session.endTime = new Date().toISOString();
    session.duration = duration;
    session.reason = reason;
    session.status = 'ended';

    console.log(`Ended session: ${sessionId}, duration: ${duration}s, reason: ${reason}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      error: 'Failed to end session',
      message: error.message,
    });
  }
});

app.post('/api/video/metrics', (req, res) => {
  try {
    const { sessionId, metrics } = req.body;
    console.log(`Metrics for session ${sessionId}:`, metrics);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reporting metrics:', error);
    res.status(500).json({
      error: 'Failed to report metrics',
      message: error.message,
    });
  }
});

app.get('/api/video/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      error: 'Session not found',
    });
  }

  res.json(session);
});

app.get('/api/video/sessions', (req, res) => {
  const allSessions = Array.from(sessions.values());
  res.json({
    count: allSessions.length,
    sessions: allSessions,
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

module.exports = app;
