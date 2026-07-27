# Testing Guide: Connecting Two Devices for Video Calls

This guide explains how to test video calls between two devices (or simulate with one device).

## 🎯 Testing Scenarios

### Scenario 1: Two Physical Devices (Recommended)
### Scenario 2: One Device + Web Browser
### Scenario 3: Two Simulators/Emulators
### Scenario 4: Single Device Self-Test

---

## 📱 Scenario 1: Two Physical Devices (Best for Real Testing)

### Setup

**Device 1 (Doctor):**
- iPhone or Android phone
- Install the app
- Configure as "Doctor" role

**Device 2 (Patient):**
- iPhone or Android phone  
- Install the app
- Configure as "Patient" role

### Steps

1. **Start Backend API:**
```bash
# Using Docker (recommended)
cd telemedicine-video-app
docker-compose up

# OR without Docker
cd backend
npm install
npm start
```

2. **Configure Both Devices:**

Update `.env` on both devices to point to your backend:
```bash
# If backend is on your computer
API_BASE_URL=http://YOUR_COMPUTER_IP:3000

# Example:
API_BASE_URL=http://192.168.1.100:3000
```

**Find your computer's IP:**
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

3. **Launch App on Both Devices:**

**Device 1 (Doctor):**
```typescript
// In your app, set user info
const doctor = {
  id: 'doctor_1',
  name: 'Dr. Smith',
  role: 'doctor',
};

// Use same channel name
const channelName = 'test_appointment_123';
const uid = 1; // Doctor UID
```

**Device 2 (Patient):**
```typescript
// In your app, set user info
const patient = {
  id: 'patient_1',
  name: 'John Doe',
  role: 'patient',
};

// Use SAME channel name
const channelName = 'test_appointment_123';
const uid = 2; // Patient UID
```

4. **Join Call:**

Both devices should join the same channel:
```typescript
// On both devices
const token = await ApiClient.getAgoraToken(
  'appointment_123',
  'test_appointment_123',
  uid // Different UID for each device
);

await AgoraService.joinChannel(
  token.token,
  token.channelName,
  token.uid
);
```

5. **Verify Connection:**
- ✅ Both devices should see each other's video
- ✅ Audio should work both ways
- ✅ Controls (mute, video toggle) should work

---

## 🌐 Scenario 2: One Device + Web Browser

Perfect for quick testing without a second device.

### Setup

**Mobile Device:**
- Your React Native app

**Web Browser:**
- Use Agora Web SDK demo

### Steps

1. **Start Backend:**
```bash
docker-compose up
```

2. **Launch Mobile App:**
```typescript
const channelName = 'test_web_mobile';
const uid = 1;

const token = await ApiClient.getAgoraToken(
  'test_appointment',
  channelName,
  uid
);

await AgoraService.joinChannel(token.token, channelName, uid);
```

3. **Open Web Demo:**

Create a simple HTML file (`web-test.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <title>Agora Web Test</title>
  <script src="https://download.agora.io/sdk/release/AgoraRTC_N.js"></script>
</head>
<body>
  <h1>Web Test Client</h1>
  <div id="local-video" style="width: 640px; height: 480px;"></div>
  <div id="remote-video" style="width: 640px; height: 480px;"></div>
  
  <button onclick="joinChannel()">Join Call</button>
  <button onclick="leaveChannel()">Leave Call</button>

  <script>
    const APP_ID = 'YOUR_AGORA_APP_ID';
    const CHANNEL = 'test_web_mobile';
    const TOKEN = null; // Get from your backend
    
    let client;
    let localTracks = {
      videoTrack: null,
      audioTrack: null
    };

    async function joinChannel() {
      // Get token from backend
      const response = await fetch('http://localhost:3000/api/video/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: 'test_appointment',
          channelName: CHANNEL,
          uid: 2
        })
      });
      const data = await response.json();

      // Create client
      client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      // Join channel
      await client.join(APP_ID, CHANNEL, data.token, 2);
      
      // Create local tracks
      localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
      
      // Play local video
      localTracks.videoTrack.play('local-video');
      
      // Publish tracks
      await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
      
      // Subscribe to remote users
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          user.videoTrack.play('remote-video');
        }
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });
      
      console.log('Joined channel successfully');
    }

    async function leaveChannel() {
      localTracks.audioTrack?.close();
      localTracks.videoTrack?.close();
      await client?.leave();
      console.log('Left channel');
    }
  </script>
</body>
</html>
```

4. **Test:**
- Open `web-test.html` in browser
- Click "Join Call"
- Mobile app should see web user
- Web should see mobile user

---

## 📱 Scenario 3: Two Simulators/Emulators

### iOS Simulators

**Limitation:** iOS Simulator doesn't support camera/microphone

**Workaround:** Use real devices or test with web

### Android Emulators

**Setup:**
1. Create two Android emulators in Android Studio
2. Enable camera/microphone in emulator settings
3. Run app on both emulators

**Steps:**
```bash
# Terminal 1 - Emulator 1
emulator -avd Pixel_5_API_31 -port 5554

# Terminal 2 - Emulator 2  
emulator -avd Pixel_6_API_31 -port 5556

# Terminal 3 - Run app on Emulator 1
adb -s emulator-5554 install app.apk

# Terminal 4 - Run app on Emulator 2
adb -s emulator-5556 install app.apk
```

**Configure:**
- Both emulators use `10.0.2.2` to access host machine
- Backend URL: `http://10.0.2.2:3000`

---

## 🔧 Scenario 4: Single Device Self-Test

Test video functionality on one device without connecting to another user.

### Mock Remote User

Create a test mode in your app:

```typescript
// TestVideoScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import AgoraService from '../services/video/AgoraService';
import ApiClient from '../services/api/ApiClient';

export const TestVideoScreen = () => {
  const [isInCall, setIsInCall] = useState(false);
  const [testMode, setTestMode] = useState<'local-only' | 'echo'>('local-only');

  const startTest = async () => {
    try {
      // Initialize Agora
      await AgoraService.initialize();

      if (testMode === 'local-only') {
        // Test local video only (no channel join)
        await AgoraService.enableLocalVideo(true);
        console.log('Local video test started');
      } else {
        // Echo test - join channel alone
        const token = await ApiClient.getAgoraToken(
          'test_appointment',
          'echo_test_channel',
          0
        );

        await AgoraService.joinChannel(
          token.token,
          token.channelName,
          token.uid
        );

        // Enable video/audio
        await AgoraService.enableLocalVideo(true);
        await AgoraService.muteLocalAudio(false);
        
        console.log('Echo test started - you should see yourself');
      }

      setIsInCall(true);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const stopTest = async () => {
    try {
      if (testMode === 'echo') {
        await AgoraService.leaveChannel();
      } else {
        await AgoraService.enableLocalVideo(false);
      }
      setIsInCall(false);
    } catch (error) {
      console.error('Stop test failed:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Video Test</Text>
      
      <Button
        title="Local Video Only"
        onPress={() => setTestMode('local-only')}
      />
      
      <Button
        title="Echo Test (Join Channel)"
        onPress={() => setTestMode('echo')}
      />
      
      <Button
        title={isInCall ? 'Stop Test' : 'Start Test'}
        onPress={isInCall ? stopTest : startTest}
      />
      
      <Text style={{ marginTop: 20 }}>
        Mode: {testMode}
      </Text>
      <Text>
        Status: {isInCall ? 'Testing...' : 'Idle'}
      </Text>
    </View>
  );
};
```

---

## 🐳 Docker Setup for Testing

### Quick Start

```bash
# 1. Clone/navigate to project
cd telemedicine-video-app

# 2. Configure environment
cp .env.example .env
# Edit .env with your Agora credentials

# 3. Start backend
docker-compose up

# 4. Backend is now running at http://localhost:3000
```

### Verify Backend

```bash
# Health check
curl http://localhost:3000/health

# Test token generation
curl -X POST http://localhost:3000/api/video/token \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "test_123",
    "channelName": "test_channel",
    "uid": 1
  }'
```

### Docker Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Remove all containers and volumes
docker-compose down -v
```

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Backend starts successfully
- [ ] Token generation works
- [ ] App connects to backend
- [ ] Video call initiates
- [ ] Both users see each other
- [ ] Audio works both ways
- [ ] Video quality is acceptable

### Controls Testing
- [ ] Mute/unmute audio
- [ ] Enable/disable video
- [ ] Switch camera (front/back)
- [ ] Enable/disable speaker
- [ ] End call properly

### Network Testing
- [ ] Test on WiFi
- [ ] Test on 4G/5G
- [ ] Test with poor connection (use network throttling)
- [ ] Test reconnection after disconnect
- [ ] Test with airplane mode toggle

### Edge Cases
- [ ] One user joins late
- [ ] One user leaves early
- [ ] App goes to background
- [ ] Incoming phone call during video call
- [ ] Low battery mode
- [ ] Device rotation

---

## 🔍 Debugging Tips

### Check Backend Logs

```bash
# Docker
docker-compose logs -f api

# Without Docker
# Check terminal where you ran `npm start`
```

### Check Mobile Logs

**iOS:**
```bash
# Xcode console or
react-native log-ios
```

**Android:**
```bash
# Android Studio Logcat or
react-native log-android

# Filter for your app
adb logcat | grep "AgoraService\|ApiClient"
```

### Common Issues

**Issue: "Cannot connect to backend"**
```bash
# Solution: Check API_BASE_URL in .env
# Use computer's IP, not localhost
API_BASE_URL=http://192.168.1.100:3000
```

**Issue: "Token generation failed"**
```bash
# Solution: Check Agora credentials in backend .env
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
```

**Issue: "Video not showing"**
```bash
# Solution: Check permissions
# iOS: Info.plist camera/microphone permissions
# Android: AndroidManifest.xml + runtime permissions
```

**Issue: "Users can't see each other"**
```bash
# Solution: Ensure both use SAME channel name
# Check UIDs are different (uid1 !== uid2)
```

---

## 📊 Test Scenarios Matrix

| Scenario | Setup Time | Realism | Best For |
|----------|-----------|---------|----------|
| Two Physical Devices | 5 min | ⭐⭐⭐⭐⭐ | Final testing |
| Device + Web | 3 min | ⭐⭐⭐⭐ | Quick testing |
| Two Emulators | 10 min | ⭐⭐⭐ | Development |
| Single Device | 2 min | ⭐⭐ | Basic checks |

---

## 🎬 Quick Test Script

Save as `test-video-call.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Telemedicine Video Test"

# 1. Start backend
echo "📡 Starting backend..."
cd telemedicine-video-app
docker-compose up -d

# Wait for backend
sleep 5

# 2. Test backend
echo "🧪 Testing backend..."
curl -s http://localhost:3000/health | jq

# 3. Generate test token
echo "🔑 Generating test token..."
curl -s -X POST http://localhost:3000/api/video/token \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "test_123",
    "channelName": "test_channel",
    "uid": 1
  }' | jq

echo "✅ Backend ready!"
echo "📱 Now launch the app on your devices"
echo "🔗 Use channel name: test_channel"
echo "👤 Device 1 UID: 1"
echo "👤 Device 2 UID: 2"
```

Run it:
```bash
chmod +x test-video-call.sh
./test-video-call.sh
```

---

## 📝 Test Report Template

```markdown
## Video Call Test Report

**Date:** YYYY-MM-DD
**Tester:** Name
**Devices:** iPhone 12 + Samsung Galaxy S21

### Setup
- [ ] Backend started successfully
- [ ] Both devices connected to backend
- [ ] Tokens generated successfully

### Video Quality
- Resolution: 720p / 480p / 1080p
- Frame rate: 30fps / 15fps
- Latency: < 300ms / 300-500ms / > 500ms
- Quality rating: ⭐⭐⭐⭐⭐

### Audio Quality
- Clarity: Excellent / Good / Poor
- Echo: None / Slight / Significant
- Latency: < 200ms / 200-400ms / > 400ms

### Functionality
- [ ] Video toggle works
- [ ] Audio mute works
- [ ] Camera switch works
- [ ] Speaker toggle works
- [ ] Call end works

### Network Tests
- [ ] WiFi: ✅ / ❌
- [ ] 4G: ✅ / ❌
- [ ] Poor network: ✅ / ❌
- [ ] Reconnection: ✅ / ❌

### Issues Found
1. [Describe issue]
2. [Describe issue]

### Overall Rating: ⭐⭐⭐⭐⭐

### Notes:
[Additional observations]
```

---

## 🎯 Success Criteria

Your video call implementation is ready when:

✅ Two devices can connect and see each other  
✅ Audio is clear with < 200ms latency  
✅ Video is smooth at 30fps  
✅ Controls work reliably  
✅ Reconnection works after network issues  
✅ No crashes or memory leaks  
✅ Battery usage is acceptable (< 20% per 30 min)  

---

**Ready to test? Start with Scenario 1 (Two Physical Devices) for best results!**