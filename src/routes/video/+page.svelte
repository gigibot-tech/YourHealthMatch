<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { appointmentService } from '$lib/application/services';
	import { canJoinVideo, fetchVideoToken, startAgoraSession, type AgoraSession } from '$lib/plugins/telehealth/telehealth';
	import type { Role } from '$lib/domain/appointment/lifecycleEngine';

	let localEl = $state<HTMLDivElement | null>(null);
	let remoteEl = $state<HTMLDivElement | null>(null);
	let status = $state('Idle');
	let error = $state('');
	let session: AgoraSession | null = null;

	let appt = $derived(appointmentService.get($page.url.searchParams.get('id') || ''));
	let actor = $derived(($page.url.searchParams.get('role') as Role) || 'patient');

	async function join() {
		error = '';
		if (!appt) {
			error = 'Appointment not found';
			return;
		}
		const gate = canJoinVideo(appt, actor);
		if (!gate.ok) {
			error = gate.reason || 'Cannot join';
			return;
		}
		if (!localEl || !remoteEl) return;
		try {
			status = 'Connecting…';
			const token = await fetchVideoToken({
				appointmentId: appt.id,
				channelName: appt.channel,
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
			status = 'In call';
		} catch (e) {
			status = 'Idle';
			error = e instanceof Error ? e.message : 'Join failed';
		}
	}

	async function leave() {
		await session?.leave();
		session = null;
		status = 'Idle';
		if (localEl) localEl.innerHTML = 'Camera not started';
		if (remoteEl) remoteEl.innerHTML = 'Waiting…';
	}

	onDestroy(() => {
		session?.leave();
	});
</script>

<div class="page-header">
	<h1>Video visit</h1>
	<p class="sub">Status: {status}</p>
</div>

{#if error}<p class="detail" style="color:var(--color-danger)">{error}</p>{/if}

<div class="video-grid">
	<div class="video-pane" bind:this={localEl}>Camera not started</div>
	<div class="video-pane" bind:this={remoteEl}>Waiting…</div>
</div>

<div class="actions" style="margin-top:1rem">
	<button class="btn btn-primary" type="button" onclick={join} disabled={status === 'In call'}>Join</button>
	<button class="btn" type="button" onclick={leave} disabled={status !== 'In call'}>Leave</button>
	<a class="btn btn-ghost" href={actor === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
		>Back</a
	>
</div>
