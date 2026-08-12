/**
 * Local / Docker entrypoint for the telemedicine video API.
 */

const app = require('./app');

const PORT = process.env.PORT || 3000;
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

const server = app.listen(PORT, () => {
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

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => process.exit(0));
});
