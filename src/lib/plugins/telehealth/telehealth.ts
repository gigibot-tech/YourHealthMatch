import type { AppointmentLike, PolicyContext } from '$lib/domain/appointment/policies';
import { mayJoinVideo } from '$lib/domain/appointment/policies';
import type { Role } from '$lib/domain/appointment/lifecycleEngine';
import { FEATURES } from '$lib/config/clinicPolicy';

export function canJoinVideo(
	appointment: AppointmentLike,
	actor: Role,
	now = Date.now()
): { ok: boolean; reason?: string } {
	if (!FEATURES.telehealth) return { ok: false, reason: 'Telehealth is disabled.' };
	const ctx: PolicyContext = { appointment, actor, now };
	const r = mayJoinVideo(ctx);
	return r.ok ? { ok: true } : { ok: false, reason: r.reason };
}

export async function fetchVideoToken(input: {
	appointmentId: string;
	channelName: string;
	uid?: number;
	apiBase?: string;
}): Promise<{ token: string; appId: string; channelName: string; uid: number }> {
	const base = (input.apiBase || (typeof window !== 'undefined' ? window.location.origin : '')).replace(
		/\/$/,
		''
	);
	const res = await fetch(`${base}/api/video/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			appointmentId: input.appointmentId,
			channelName: input.channelName,
			uid: input.uid ?? 0
		})
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const detail = data.error || data.message || res.statusText;
		throw new Error(
			detail === 'Server configuration error'
				? 'Agora not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE on Netlify.'
				: detail
		);
	}
	return {
		token: data.token,
		appId: data.appId,
		channelName: data.channelName || input.channelName,
		uid: data.uid ?? input.uid ?? 0
	};
}

/** Minimal Agora session wrapper — join/leave only. */
export type AgoraSession = {
	leave: () => Promise<void>;
};

export async function startAgoraSession(opts: {
	appId: string;
	channel: string;
	token: string;
	uid: number;
	localContainer: HTMLElement;
	remoteContainer: HTMLElement;
}): Promise<AgoraSession> {
	const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
	const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
	await client.join(opts.appId, opts.channel, opts.token, opts.uid);
	const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks();
	opts.localContainer.innerHTML = '';
	cam.play(opts.localContainer);
	await client.publish([mic, cam]);
	client.on('user-published', async (user, mediaType) => {
		await client.subscribe(user, mediaType);
		if (mediaType === 'video') {
			opts.remoteContainer.innerHTML = '';
			user.videoTrack?.play(opts.remoteContainer);
		}
		if (mediaType === 'audio') user.audioTrack?.play();
	});
	return {
		leave: async () => {
			mic.close();
			cam.close();
			await client.leave();
		}
	};
}
