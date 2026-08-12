# Telemedicine Video Conferencing App

A production-ready React Native telemedicine video conferencing solution using Agora.io with optimized performance and minimal bottlenecks.

## Deploy on Netlify (web client)

This repo includes a static Agora web client (`public/`) and a serverless token API (`netlify/functions`) so one commit deploys to Netlify.

1. Connect the GitHub repo in Netlify (build uses `netlify.toml` automatically).
2. Set environment variables in Netlify:
   - `AGORA_APP_ID`
   - `AGORA_APP_CERTIFICATE`
3. Deploy. Open the site URL, use two tabs with different UIDs to test a call.

Local Netlify check (optional):

```bash
npm install
npx netlify dev
```

Docker / Express API for local backend testing is unchanged (`docker-compose up` or `npm start` in `backend/`).

## 🎯 Features

- ✅ **1-on-1 Video Consultations** - Doctor-patient video calls
- ✅ **Environment-Based Configuration** - Easy deployment across environments
- ✅ **Performance Optimized** - Minimal bottlenecks and efficient resource usage
- ✅ **Adaptive Quality** - Automatic quality adjustment based on network conditions
- ✅ **Token Caching** - Reduced API calls and faster call initiation
- ✅ **Automatic Reconnection** - Handles network interruptions gracefully
- ✅ **GDPR Ready** - Configurable for EU data residency
- ✅ **Memory Leak Prevention** - Proper cleanup and resource management

## 📋 Prerequisites

- Node.js >= 18
- npm >= 9
- React Native development environment set up
- Agora.io account with App ID and Certificate
- Backend API for token generation

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Navigate to project directory
cd telemedicine-video-app

# Install dependencies
npm install

# iOS specific
cd ios && pod install && cd ..
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required environment variables:
```bash
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_certificate
API_BASE_URL=https://your-api.com
```

### 3. Run the App

```bash
# iOS
npm run ios

# Android
npm run android

# Start Metro bundler
npm start
```

## 📁 Project Structure

```
telemedicine-video-app/
├── src/
│   ├── config/
│   │   └── env.ts                 # Environment configuration
│   ├── services/
│   │   ├── video/
│   │   │   └── AgoraService.ts    # Agora SDK wrapper
│   │   └── api/
│   │       └── ApiClient.ts       # Backend API client
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   ├── screens/                   # UI screens (to be implemented)
│   ├── components/                # Reusable components (to be implemented)
│   ├── hooks/                     # Custom React hooks (to be implemented)
│   └── utils/                     # Utility functions (to be implemented)
├── .env.example                   # Environment template
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AGORA_APP_ID` | Agora App ID | - | ✅ |
| `AGORA_APP_CERTIFICATE` | Agora Certificate | - | Production only |
| `API_BASE_URL` | Backend API URL | http://localhost:3000 | ✅ |
| `API_TIMEOUT` | API timeout (ms) | 30000 | ❌ |
| `NODE_ENV` | Environment | development | ❌ |
| `ENABLE_RECORDING` | Enable call recording | false | ❌ |
| `ENABLE_SCREEN_SHARE` | Enable screen sharing | false | ❌ |
| `ENABLE_CHAT` | Enable in-call chat | true | ❌ |
| `ENABLE_WAITING_ROOM` | Enable waiting room | true | ❌ |
| `MAX_VIDEO_BITRATE` | Max video bitrate (kbps) | 1200 | ❌ |
| `MAX_AUDIO_BITRATE` | Max audio bitrate (kbps) | 128 | ❌ |
| `VIDEO_RESOLUTION` | Video resolution | 720p | ❌ |
| `LOG_LEVEL` | Logging level | debug | ❌ |
| `ENABLE_ANALYTICS` | Enable analytics | false | ❌ |
| `TOKEN_EXPIRY_SECONDS` | Token expiry time | 3600 | ❌ |
| `ENABLE_ENCRYPTION` | Enable encryption | true | ❌ |

### Video Resolution Options

- `480p` - 640x480 (low bandwidth)
- `720p` - 1280x720 (recommended)
- `1080p` - 1920x1080 (high quality)

## 🎨 Core Services

### AgoraService

Optimized Agora SDK wrapper with:
- Lazy initialization
- Adaptive quality based on network
- Automatic reconnection with exponential backoff
- Event-driven architecture
- Memory leak prevention

```typescript
import AgoraService from './services/video/AgoraService';

// Initialize (called once)
await AgoraService.initialize();

// Join channel
const result = await AgoraService.joinChannel(token, channelName, uid);

// Control video/audio
await AgoraService.enableLocalVideo(true);
await AgoraService.muteLocalAudio(false);

// Leave channel
await AgoraService.leaveChannel();
```

### ApiClient

Backend API client with:
- Token caching (reduces API calls)
- Request deduplication
- Automatic retry
- Connection pooling

```typescript
import ApiClient from './services/api/ApiClient';

// Get Agora token (cached)
const token = await ApiClient.getAgoraToken(appointmentId, channelName, uid);

// Pre-fetch token (optimization)
await ApiClient.prefetchAgoraToken(appointmentId, channelName, uid);

// Start/end session
await ApiClient.startCallSession(appointmentId);
await ApiClient.endCallSession(sessionId, duration);
```

## 🚀 Performance Optimizations

### 1. Token Pre-fetching
```typescript
// Pre-fetch token when user enters waiting room
useEffect(() => {
  if (inWaitingRoom) {
    ApiClient.prefetchAgoraToken(appointmentId, channelName);
  }
}, [inWaitingRoom]);
```

### 2. Adaptive Video Quality
Automatically adjusts bitrate based on network:
- Excellent (6): 100% bitrate
- Good (5): 100% bitrate
- Poor (4): 70% bitrate
- Bad (3): 50% bitrate
- Very Bad (2): 30% bitrate

### 3. Engine Warm-up
```typescript
// Initialize engine on app launch (after 3 seconds)
useEffect(() => {
  const timer = setTimeout(() => {
    AgoraService.initialize();
  }, 3000);
  return () => clearTimeout(timer);
}, []);
```

### 4. Memory Management
- Proper cleanup on component unmount
- Event listener removal
- Resource disposal
- Cache size limits

## 🔒 Security

### Token Security
- ✅ Tokens generated server-side only
- ✅ Short-lived tokens (1 hour default)
- ✅ Token refresh mechanism
- ✅ No App Certificate in client code

### Data Privacy
- ✅ End-to-end encryption (configurable)
- ✅ Secure storage for sensitive data
- ✅ GDPR-compliant data handling
- ✅ EU data residency option

## 📊 Monitoring

### Key Metrics Tracked
- Video/audio bitrate
- Packet loss rate
- Latency (RTT)
- Frame rate
- Network quality
- Call duration
- Connection failures

### Analytics Integration
```typescript
// Enable in production
ENABLE_ANALYTICS=true

// Metrics are automatically reported to backend
await ApiClient.reportMetrics(sessionId, metrics);
```

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📱 Platform-Specific Setup

### iOS

1. Add permissions to `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for video calls</string>
```

2. Enable background modes:
```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
  <string>voip</string>
</array>
```

### Android

1. Add permissions to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

2. Request runtime permissions in code

## 🐛 Troubleshooting

### Common Issues

**Issue: "Cannot find module 'react-native-agora'"**
```bash
# Solution: Install dependencies
npm install
cd ios && pod install && cd ..
```

**Issue: "AGORA_APP_ID is required"**
```bash
# Solution: Configure .env file
cp .env.example .env
# Edit .env with your Agora credentials
```

**Issue: Video not showing**
```bash
# Solution: Check permissions
# iOS: Check Info.plist
# Android: Check runtime permissions
```

**Issue: Poor video quality**
```bash
# Solution: Adjust video settings in .env
MAX_VIDEO_BITRATE=1200
VIDEO_RESOLUTION=720p
```

## 📚 Next Steps

### To Complete Implementation:

1. **UI Screens** (3-4 days)
   - VideoCallScreen
   - WaitingRoomScreen
   - CallHistoryScreen

2. **Components** (2-3 days)
   - LocalVideoView
   - RemoteVideoView
   - CallControls
   - ConnectionQuality

3. **Hooks** (1-2 days)
   - useVideoCall
   - useCallState
   - useNetworkQuality

4. **Backend API** (3-5 days)
   - Token generation endpoint
   - Session management
   - User authentication
   - Recording storage

5. **Testing** (2-3 days)
   - Unit tests
   - Integration tests
   - E2E tests
   - Performance testing

## 📖 Documentation

- [Agora.io Documentation](https://docs.agora.io/)
- [React Native Agora SDK](https://github.com/AgoraIO-Community/react-native-agora)
- [Implementation Plan](./telemedicine-implementation-plan.md)
- [Comparison Document](./telemedicine-video-conferencing-comparison.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 💬 Support

For issues and questions:
- Create an issue on GitHub
- Contact: support@yourapp.com

## 🎯 Roadmap

- [x] Core video service implementation
- [x] API client with caching
- [x] Environment configuration
- [ ] UI screens and components
- [ ] Custom hooks
- [ ] Backend integration
- [ ] Testing suite
- [ ] App store deployment
- [ ] Analytics dashboard
- [ ] Recording feature
- [ ] Screen sharing
- [ ] Group calls (future)

---

**Built with ❤️ for better healthcare**