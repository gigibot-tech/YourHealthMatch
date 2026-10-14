<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { page } from '$app/stores';
	import { appointmentService, homePathForRole, practiceService } from '$lib/application/services';
	import { appointments, preferences, role } from '$lib/stores/app';
	import { fill, t, uiLanguage } from '$lib/i18n';
	import { formatApptDate, formatTime } from '$lib/ui/clinicFormat';
	import {
		canJoinVideo,
		fetchVideoToken,
		startAgoraSession,
		type AgoraSession
	} from '$lib/plugins/telehealth/telehealth';
	import type { Role } from '$lib/domain/appointment/lifecycleEngine';
	import { resolveVideoAccess } from '$lib/domain/video/videoAccess';

	let localEl = $state<HTMLDivElement | null>(null);
	let remoteEl = $state<HTMLDivElement | null>(null);
	let status = $state<'idle' | 'connecting' | 'live'>('idle');
	let error = $state('');
	let session: AgoraSession | null = null;

	let lang = $derived(uiLanguage($preferences.language));
	let apptId = $derived($page.url.searchParams.get('id') || '');
	let actor = $derived.by((): Role => {
		const fromQuery = $page.url.searchParams.get('role');
		if (fromQuery === 'doctor' || fromQuery === 'patient') return fromQuery;
		if ($role === 'doctor' || $role === 'patient') return $role;
		return 'patient';
	});
	let appt = $derived($appointments.find((a) => a.id === apptId) ?? appointmentService.get(apptId));
	let practice = $derived(appt ? practiceService.get(appt.practiceId) : undefined);
	let doctor = $derived(practice?.doctors.find((d) => d.id === appt?.doctorId) || practice?.doctors[0]);
	let doctorStarted = $derived(Boolean(appt?.callStartedAt));
	let place = $derived(
		appt
			? resolveVideoAccess({ practice, doctor, modality: appt.modality })
			: ({ kind: 'none' } as const)
	);
	let inRoom = $derived(status === 'connecting' || status === 'live');
	let backHref = $derived(homePathForRole(actor));

	async function openRoom() {
		error = '';
		if (!appt) {
			error = 'Appointment not found';
			return;
		}
		try {
			if (actor === 'doctor' && !appt.callStartedAt) {
				appointmentService.startCall(appt.id);
			}
			const current = appointmentService.get(appt.id);
			if (!current) return;
			const gate = canJoinVideo(current, actor);
			if (!gate.ok) {
				error = gate.reason || 'Cannot join';
				return;
			}
			if (actor === 'patient' && !current.callStartedAt) {
				error = 'The doctor has not started this visit yet.';
				return;
			}
			status = 'connecting';
			await tick();
			if (!localEl || !remoteEl) {
				status = 'idle';
				error = 'Video view is not ready';
				return;
			}
			const token = await fetchVideoToken({
				appointmentId: current.id,
				channelName: current.channel,
				uid: actor === 'doctor' ? 2 : 1
			});
			session = await startAgoraSession({
				appId: token.appId,
				channel: token.channelName,
				token: token.token,
				uid: token.uid,
				localContainer: localEl,
				remoteContainer: remoteEl
			});
			status = 'live';
		} catch (e) {
			status = 'idle';
			error = e instanceof Error ? e.message : 'Could not open the visit';
		}
	}

	async function leave() {
		await session?.leave();
		session = null;
		status = 'idle';
	}

	onDestroy(() => {
		session?.leave();
	});
</script>

<div class="video-call">
	{#if !appt}
		<div class="card video-wait">
			<h1>{t(lang, 'video.notFound')}</h1>
			<a class="btn btn-ghost" href={backHref}>{t(lang, 'video.back')}</a>
		</div>
	{:else if place.kind === 'external'}
		<div class="card video-wait">
			<p class="eyebrow">{t(lang, 'video.kicker')}</p>
			<h1>{place.systemName}</h1>
			<p>{fill(lang, 'dash.videoOn', { system: place.systemName })}</p>
			<a class="btn btn-primary" href={backHref}>{t(lang, 'video.backVisits')}</a>
		</div>
	{:else if place.kind === 'none'}
		<div class="card video-wait">
			<h1>Video isn’t enabled for this visit</h1>
			<p class="detail">Only a video-enabled doctor at a clinic that books here opens a room in this app.</p>
			<a class="btn btn-ghost" href={backHref}>{t(lang, 'video.back')}</a>
		</div>
	{:else if !inRoom && actor === 'patient' && !doctorStarted}
		<div class="card video-wait">
			<p class="eyebrow">{t(lang, 'video.kicker')}</p>
			<h1>{doctor?.name || 'Your doctor'}</h1>
			<p class="detail">
				{formatApptDate(appt.date)} · {formatTime(appt.time)}
				{#if practice}· {practice.name}{/if}
			</p>
			<p>{t(lang, 'video.waits')}</p>
			<a class="btn btn-primary" href={backHref}>{t(lang, 'video.backVisits')}</a>
		</div>
	{:else if !inRoom}
		<div class="card video-wait">
			<p class="eyebrow">{t(lang, 'video.kicker')}</p>
			<h1>{actor === 'doctor' ? appt.patientName : doctor?.name || 'Your doctor'}</h1>
			<p class="detail">
				{formatApptDate(appt.date)} · {formatTime(appt.time)}
				{#if practice}· {practice.name}{/if}
			</p>
			{#if actor === 'doctor'}
				<p>{t(lang, 'video.youOpen')}</p>
				<button class="btn btn-primary" type="button" onclick={openRoom}>{t(lang, 'video.start')}</button>
			{:else}
				<p>{doctor?.name || 'Your doctor'} {t(lang, 'video.opened')}</p>
				<button class="btn btn-primary" type="button" onclick={openRoom}>{t(lang, 'video.join')}</button>
			{/if}
			<a class="btn btn-ghost" href={backHref}>{t(lang, 'video.back')}</a>
			{#if error}<p class="detail video-error">{error}</p>{/if}
		</div>
	{:else}
		<div class="page-header">
			<div>
				<h1>{actor === 'doctor' ? appt.patientName : doctor?.name}</h1>
				<p class="sub">
					{status === 'live' ? 'In the visit' : 'Connecting…'}
					· {formatTime(appt.time)}
				</p>
			</div>
		</div>
		{#if error}<p class="detail video-error">{error}</p>{/if}
		<div class="video-grid">
			<div class="video-pane" bind:this={localEl}>Your camera</div>
			<div class="video-pane" bind:this={remoteEl}>
				{actor === 'doctor' ? 'Waiting for the patient' : 'Waiting for the doctor'}
			</div>
		</div>
		<div class="actions">
			<button class="btn" type="button" onclick={leave}>Leave</button>
			<a class="btn btn-ghost" href={backHref}>Back</a>
		</div>
	{/if}
</div>
