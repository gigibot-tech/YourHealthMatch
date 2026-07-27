# 🚀 Quick Start Guide - Test in 5 Minutes

Get your telemedicine video call working locally in just 5 minutes!

## ✅ Prerequisites

- Docker Desktop installed and running
- Agora.io account (free tier works)
- Web browser (Chrome/Firefox recommended)

---

## 📝 Step 1: Get Agora Credentials (2 minutes)

1. Go to https://console.agora.io
2. Sign up (free)
3. Create a new project
4. **Enable App Certificate** (important!)
5. Copy your **App ID** and **App Certificate**

---

## 🐳 Step 2: Start Backend (1 minute)

```bash
# Navigate to project
cd telemedicine-video-app

# Copy environment template
cp .env.example .env

# Edit .env and add your Agora credentials
# AGORA_APP_ID=your_app_id_here
# AGORA_APP_CERTIFICATE=your_certificate_here

# Start backend with Docker
docker-compose up
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║  Telemedicine Video API Server                             ║
║  Port: 3000                                                ║
║  Agora App ID: ✓ Configured                               ║
║  Agora Certificate: ✓ Configured                          ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🧪 Step 3: Test Backend (30 seconds)

Open a new terminal and run:

```bash
# Make script executable
chmod +x test-local.sh

# Run tests
./test-local.sh
```

You should see:
```
✅ Docker is running
✅ .env file found
✅ Agora credentials configured
✅ Health check passed
✅ Token generation passed
✅ Session start passed
✅ List sessions passed
✅ End session passed
🎉 All tests passed!
```

---

## 🎥 Step 4: Test Video Call (2 minutes)

### Option A: Two Browser Tabs (Easiest)

1. **Open `test-web-client.html` in your browser**
   ```bash
   # Just double-click the file or
   open test-web-client.html
   ```

2. **First Tab (Doctor):**
   - Backend URL: `http://localhost:3000`
   - Channel Name: `test_channel`
   - User ID: `1`
   - Role: Doctor
   - Click **"Join Call"**

3. **Second Tab (Patient):**
   - Open same file in new tab
   - Backend URL: `http://localhost:3000`
   - Channel Name: `test_channel` (SAME as first tab)
   - User ID: `2` (DIFFERENT from first tab)
   - Role: Patient
   - Click **"Join Call"**

4. **Result:** You should see yourself in both tabs! 🎉

### Option B: Browser + Mobile Device

1. **Find your computer's IP:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

2. **Browser (Computer):**
   - Open `test-web-client.html`
   - Backend URL: `http://localhost:3000`
   - UID: `1`
   - Join call

3. **Mobile App:**
   - Configure app with: `http://YOUR_IP:3000`
   - Use same channel name: `test_channel`
   - Use different UID: `2`
   - Join call

4. **Result:** Computer and phone should see each other! 🎉

---

## 🎯 What You Just Did

```
┌─────────────────────────────────────────────────────────┐
│                  Your Computer                           │
│                                                          │
│  ┌──────────────┐              ┌──────────────┐        │
│  │  Browser 1   │              │  Browser 2   │        │
│  │  (Doctor)    │              │  (Patient)   │        │
│  │  UID: 1      │              │  UID: 2      │        │
│  └──────┬───────┘              └──────┬───────┘        │
│         │                              │                │
│         │  Get Token                   │  Get Token     │
│         ▼                              ▼                │
│  ┌─────────────────────────────────────────────────┐   │
│  │     Docker Backend (localhost:3000)             │   │
│  │     - Generates Agora tokens                    │   │
│  │     - Manages sessions                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                              │
         │  Join Channel                │  Join Channel
         ▼                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Agora Cloud                            │
│              (Video/Audio Relay)                         │
│         Channel: "test_channel"                          │
│         Participants: UID 1 & UID 2                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### Backend won't start

```bash
# Check if Docker is running
docker info

# Check if port 3000 is available
lsof -i :3000

# View backend logs
docker-compose logs -f
```

### Can't generate token

```bash
# Check .env file
cat .env

# Verify Agora credentials are correct
# They should NOT contain "your_app_id_here"

# Restart backend
docker-compose restart
```

### Video not showing

1. **Check browser permissions:**
   - Allow camera and microphone access
   - Chrome: Settings → Privacy → Site Settings

2. **Check console for errors:**
   - Press F12 in browser
   - Look at Console tab

3. **Verify same channel name:**
   - Both users must use EXACT same channel name
   - Case-sensitive!

4. **Verify different UIDs:**
   - Each user needs unique UID
   - User 1: UID 1
   - User 2: UID 2

---

## 📊 Test Checklist

- [ ] Backend starts successfully
- [ ] Health check returns "healthy"
- [ ] Token generation works
- [ ] Can join channel in browser
- [ ] Local video shows (yourself)
- [ ] Remote video shows (other user)
- [ ] Audio works both ways
- [ ] Can leave call cleanly

---

## 🎓 Understanding the Flow

### 1. Token Generation
```javascript
// Browser requests token from backend
POST http://localhost:3000/api/video/token
{
  "appointmentId": "test_appointment",
  "channelName": "test_channel",
  "uid": 1
}

// Backend generates Agora token
// Returns: { token: "006abc...", channelName: "test_channel", uid: 1 }
```

### 2. Join Channel
```javascript
// Browser uses token to join Agora channel
client.join(appId, channelName, token, uid)

// Agora validates token
// User joins channel
```

### 3. Publish/Subscribe
```javascript
// User publishes their video/audio
client.publish([audioTrack, videoTrack])

// Other users automatically receive notification
// They subscribe to see/hear you
client.subscribe(remoteUser, mediaType)
```

---

## 🚀 Next Steps

### 1. Test with Mobile App

Follow [`TESTING_GUIDE.md`](TESTING_GUIDE.md) to:
- Configure React Native app
- Test on real devices
- Test different network conditions

### 2. Implement UI

Use the provided services:
```typescript
import AgoraService from './services/video/AgoraService';
import ApiClient from './services/api/ApiClient';

// Get token
const token = await ApiClient.getAgoraToken(appointmentId, channelName, uid);

// Join call
await AgoraService.joinChannel(token.token, channelName, uid);
```

### 3. Deploy to Production

Follow [`DOCKER_SETUP.md`](DOCKER_SETUP.md) to:
- Deploy backend to cloud
- Configure production environment
- Set up monitoring

---

## 💡 Pro Tips

### Tip 1: Use Different Browsers
Test with Chrome + Firefox to simulate two different users

### Tip 2: Check Network Tab
Open DevTools → Network to see API calls

### Tip 3: Monitor Logs
Keep `docker-compose logs -f` running to see what's happening

### Tip 4: Test Poor Network
Chrome DevTools → Network → Throttling → Slow 3G

### Tip 5: Use Incognito
Open second tab in incognito mode to avoid permission issues

---

## 📝 Common Scenarios

### Scenario 1: Testing Alone
```bash
# Open test-web-client.html in two tabs
# Tab 1: UID 1
# Tab 2: UID 2
# Same channel name
# You'll see yourself in both tabs
```

### Scenario 2: Testing with Friend
```bash
# Share your computer's IP
# Friend opens: http://YOUR_IP:3000
# Both use same channel name
# Different UIDs
# You'll see each other
```

### Scenario 3: Mobile + Web
```bash
# Web: localhost:3000
# Mobile: http://YOUR_IP:3000
# Same channel, different UIDs
# Cross-platform test
```

---

## 🎉 Success Criteria

You're ready to move forward when:

✅ Backend starts without errors  
✅ Token generation works  
✅ Can join channel in browser  
✅ See yourself in local video  
✅ See other user in remote video  
✅ Audio works both directions  
✅ Can end call cleanly  

---

## 📚 Additional Resources

- **Full Testing Guide:** [`TESTING_GUIDE.md`](TESTING_GUIDE.md)
- **Docker Setup:** [`DOCKER_SETUP.md`](DOCKER_SETUP.md)
- **Implementation Details:** [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md)
- **Agora Docs:** https://docs.agora.io

---

## 🆘 Need Help?

1. **Check logs:** `docker-compose logs -f api`
2. **Check browser console:** Press F12
3. **Verify credentials:** `cat .env`
4. **Restart everything:** `docker-compose restart`

---

**Ready? Let's go! 🚀**

```bash
cd telemedicine-video-app
docker-compose up
# Then open test-web-client.html