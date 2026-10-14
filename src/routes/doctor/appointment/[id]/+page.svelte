<script lang="ts">
	import { page } from '$app/stores';
	import { appointmentService, practiceService } from '$lib/application/services';
	import { resolveVideoAccess } from '$lib/domain/video/videoAccess';
	import { appointments } from '$lib/stores/app';
	import { goto } from '$app/navigation';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';

	let id = $derived($page.params.id);
	let view = $derived.by(() => {
		const a = $appointments.find((x) => x.id === id);
		return a ? appointmentService.view(a, 'doctor') : null;
	});
	let place = $derived.by(() => {
		if (!view) return { kind: 'none' as const };
		const clinic = practiceService.get(view.practiceId);
		const doctor = clinic?.doctors.find((d) => d.id === view.doctorId);
		return resolveVideoAccess({ practice: clinic, doctor, modality: view.modality });
	});

	async function act(action: 'confirm' | 'reject' | 'cancel' | 'complete' | 'no_show' | 'join_video') {
		if (!view) return;
		try {
			if (action === 'join_video') {
				goto(`/video?id=${view.id}&role=doctor`);
				return;
			}
			if (action === 'cancel') {
				if (!confirm('Cancel this appointment? The time slot will open again.')) return;
			}
			if (action === 'reject') {
				if (!confirm('Decline this visit request? The patient will be notified.')) return;
			}
			await appointmentService.applyAction(view.id, action, 'doctor');
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Failed');
		}
	}
</script>

{#if !view}
	<div class="empty-state">Appointment not found.</div>
{:else}
	<div class="page-header">
		<h1>{view.patientName}</h1>
		<p class="sub">{view.date} · {view.time} · <span class="badge {view.badge}">{view.label}</span></p>
	</div>
	<div class="card">
		<p>{view.reason}</p>
		<p class="detail">Channel: {view.channel} · modality: {view.modality}</p>
		<div class="actions">
			{#each view.allowedActions as action}
				{#if action !== 'join_video' || place.kind === 'in_app'}
					<button
						class="btn btn-sm"
						class:btn-primary={action === 'confirm' || action === 'join_video'}
						class:btn-danger={action === 'cancel' || action === 'reject'}
						type="button"
						onclick={() => act(action)}>{action === 'join_video' ? 'Start visit' : action.replace('_', ' ')}</button
					>
				{/if}
			{/each}
			{#if place.kind === 'external'}
				<p class="detail">Video opens on {place.systemName}.</p>
			{/if}
		</div>
		<p style="margin-top:1rem"><a href="/doctor/dashboard">← Queue</a></p>
	</div>
	<ExternalSystemLinks
		practiceId={view.practiceId}
		doctorId={view.doctorId}
		title="Open in your booking / telemedicine system"
	/>
{/if}
