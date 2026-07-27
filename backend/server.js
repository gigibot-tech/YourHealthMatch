/**
 * Backend API Server for Telemedicine Video App
 * Generates Agora tokens and manages video sessions
 */

const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const TOKEN_EXPIRY_SECONDS = parseInt(process.env.TOKEN_EXPIRY_SECONDS || '3600');

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// In-memory session storage (use database in production)
const sessions = new Map();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Generate Agora RTC token
 * POST /api/video/token
 */
app.post('/api/video/token', (req, res) => {
  try {
    const { appointmentId, channelName, uid = 0 } = req.body;

    // Validate required fields
    if (!appointmentId || !channelName) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['appointmentId', 'channelName'],
      });
    }

    // Validate environment
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      console.error('Agora credentials not configured');
      return res.status(500).json({
        error: 'Server configuration error',
      });
    }

    // Generate token
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRY_SECONDS;

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER, // Can send and receive
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

/**
 * Start a video session
 * POST /api/video/session/start
 */
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

/**
 * End a video session
 * POST /api/video/session/end
 */
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

/**
 * Report call metrics
 * POST /api/video/metrics
 */
app.post('/api/video/metrics', (req, res) => {
  try {
    const { sessionId, metrics, timestamp } = req.body;

    console.log(`Metrics for session ${sessionId}:`, metrics);

    // In production, store metrics in database for analytics
    res.json({ success: true });
  } catch (error) {
    console.error('Error reporting metrics:', error);
    res.status(500).json({
      error: 'Failed to report metrics',
      message: error.message,
    });
  }
});

/**
 * Get session info (for testing)
 * GET /api/video/session/:sessionId
 */
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

/**
 * List all sessions (for testing)
 * GET /api/video/sessions
 */
app.get('/api/video/sessions', (req, res) => {
  const allSessions = Array.from(sessions.values());
  res.json({
    count: allSessions.length,
    sessions: allSessions,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Telemedicine Video API Server                             ║
║  Port: ${PORT}                                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}     ║
║  Agora App ID: ${AGORA_APP_ID ? '✓ Configured' : '✗ Missing'}           ║
║  Agora Certificate: ${AGORA_APP_CERTIFICATE ? '✓ Configured' : '✗ Missing'}    ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    console.error('\n⚠️  WARNING: Agora credentials not configured!');
    console.error('Set AGORA_APP_ID and AGORA_APP_CERTIFICATE environment variables.\n');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Made with Bob
