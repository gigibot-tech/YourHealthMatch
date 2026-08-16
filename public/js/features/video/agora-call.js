import { mountShell } from '../shell.js';
import {
  getAppointment,
  getDoctor,
  getRole,
  getVideoSession,
  clearVideoSession,
  channelFor,
} from '../../store/appointments.js';

let client = null;
let localTracks = { videoTrack: null, audioTrack: null };
let cleanupLeave = null;

function log(el, message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  el.insertBefore(entry, el.firstChild);
}

function setStatus(el, status, text) {
  el.className = `video-status ${status}`;
  el.textContent = text;
}

async function leaveCall(els) {
  if (localTracks.audioTrack) {
    localTracks.audioTrack.close();
    localTracks.audioTrack = null;
  }
  if (localTracks.videoTrack) {
    localTracks.videoTrack.close();
    localTracks.videoTrack = null;
  }
  if (client) {
    await client.leave();
    client = null;
  }
  els.local.innerHTML = '<div class="placeholder">Camera not started</div>';
  els.remote.innerHTML = '<div class="placeholder">Waiting for other user…</div>';
  setStatus(els.status, 'idle', 'Idle');
  els.joinBtn.disabled = false;
  els.leaveBtn.disabled = true;
  log(els.logs, 'Left call', 'success');
}

async function joinCall(els, { channelName, uid, role }) {
  try {
    setStatus(els.status, 'connecting', 'Connecting…');
    els.joinBtn.disabled = true;
    const backendUrl = (els.apiUrl.value || window.location.origin).replace(/\/$/, '');

    log(els.logs, 'Requesting token…', 'info');
    const response = await fetch(`${backendUrl}/api/video/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: channelName,
        channelName,
        uid,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data.error || data.message || response.statusText || `HTTP ${response.status}`;
      throw new Error(
        detail === 'Server configuration error'
          ? 'Agora not configured on Netlify. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE, then redeploy.'
          : detail
      );
    }

    log(els.logs, 'Token received', 'success');

    if (typeof AgoraRTC === 'undefined') {
      throw new Error('Agora SDK failed to load');
    }

    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        els.remote.innerHTML = '';
        user.videoTrack.play(els.remote);
        log(els.logs, 'Remote video playing', 'success');
      }
      if (mediaType === 'audio') {
        user.audioTrack.play();
        log(els.logs, 'Remote audio playing', 'success');
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        els.remote.innerHTML = '<div class="placeholder">Waiting for other user…</div>';
      }
    });

    client.on('user-left', () => {
      els.remote.innerHTML = '<div class="placeholder">Waiting for other user…</div>';
    });

    await client.join(data.appId, channelName, data.token, uid);
    log(els.logs, `Joined as ${role} (uid ${uid})`, 'success');

    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
    els.local.innerHTML = '';
    localTracks.videoTrack.play(els.local);
    await client.publish([localTracks.audioTrack, localTracks.videoTrack]);

    setStatus(els.status, 'connected', 'Connected');
    els.leaveBtn.disabled = false;
    log(els.logs, 'Published local A/V', 'success');
  } catch (err) {
    log(els.logs, err.message, 'error');
    setStatus(els.status, 'error', 'Error');
    els.joinBtn.disabled = false;
    console.error(err);
  }
}

export async function mountVideoCall(root) {
  if (cleanupLeave) {
    await cleanupLeave();
    cleanupLeave = null;
  }

  const role = getRole() || 'patient';
  const session = getVideoSession();
  const appt = session?.appointmentId ? getAppointment(session.appointmentId) : null;
  const doc = appt ? getDoctor(appt.doctorId) : null;
  const channel = appt ? appt.channel || channelFor(appt.id) : 'test_channel';
  const uid = session?.uid ?? (role === 'doctor' ? 2 : 1);
  const callRole = session?.role || role;

  const content = `
    <div class="video-page">
      <div class="page-header">
        <div>
          <h1>Video Call</h1>
          <p class="sub">${
            appt
              ? `${appt.patientName} · ${doc?.name || 'Doctor'} · ${appt.reason}`
              : 'Open from an appointment, or join a test channel.'
          }</p>
        </div>
        <span class="video-status idle" id="v-status">Idle</span>
      </div>

      <div class="video-config">
        <div class="form-row">
          <div class="form-group">
            <label for="v-api">API URL</label>
            <input id="v-api" type="text" value="" placeholder="${window.location.origin}" />
          </div>
          <div class="form-group">
            <label for="v-channel">Channel</label>
            <input id="v-channel" type="text" value="${channel}" />
          </div>
          <div class="form-group">
            <label for="v-uid">UID</label>
            <input id="v-uid" type="number" value="${uid}" />
          </div>
        </div>
        <div class="video-actions">
          <button type="button" class="btn btn-primary" id="v-join">Join Call</button>
          <button type="button" class="btn btn-danger" id="v-leave" disabled>Leave Call</button>
          <button type="button" class="btn btn-ghost" id="v-clear">Clear session</button>
        </div>
      </div>

      <div class="video-grid">
        <div class="video-box">
          <div class="video-box-header">Local (${callRole})</div>
          <div class="video-frame"><div id="v-local" class="placeholder">Camera not started</div></div>
        </div>
        <div class="video-box">
          <div class="video-box-header">Remote</div>
          <div class="video-frame"><div id="v-remote" class="placeholder">Waiting for other user…</div></div>
        </div>
      </div>

      <div class="video-logs" id="v-logs"></div>
    </div>
  `;

  mountShell(root, {
    role: role === 'doctor' ? 'doctor' : 'patient',
    activePath: '#/video',
    contentHtml: content,
  });

  const els = {
    apiUrl: root.querySelector('#v-api'),
    status: root.querySelector('#v-status'),
    joinBtn: root.querySelector('#v-join'),
    leaveBtn: root.querySelector('#v-leave'),
    local: root.querySelector('#v-local'),
    remote: root.querySelector('#v-remote'),
    logs: root.querySelector('#v-logs'),
  };

  els.apiUrl.value = window.location.origin;

  log(els.logs, 'Video ready. Use two browsers with different UIDs to test.', 'info');
  if (appt) log(els.logs, `Session linked to ${channel}`, 'info');

  els.joinBtn.addEventListener('click', () => {
    joinCall(els, {
      channelName: root.querySelector('#v-channel').value.trim(),
      uid: parseInt(root.querySelector('#v-uid').value, 10) || uid,
      role: callRole,
    });
  });

  els.leaveBtn.addEventListener('click', () => leaveCall(els));
  root.querySelector('#v-clear')?.addEventListener('click', () => {
    clearVideoSession();
    log(els.logs, 'Session cleared', 'warning');
  });

  cleanupLeave = async () => {
    try {
      await leaveCall(els);
    } catch {
      /* ignore */
    }
  };

  return cleanupLeave;
}
