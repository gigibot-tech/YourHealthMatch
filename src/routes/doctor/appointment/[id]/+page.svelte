<script lang="ts">
	import { page } from '$app/stores';
	import { appointmentService } from '$lib/application/services';
	import { appointments } from '$lib/stores/app';
	import { goto } from '$app/navigation';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';

	let id = $derived($page.params.id);
	let view = $derived.by(() => {
		const a = $appointments.find((x) => x.id === id);
		return a ? appointmentService.view(a, 'doctor') : null;
	});

	async function act(action: 'confirm' | 'reject' | 'cancel' | 'complete' | 'no_show' | 'join_video') {
		if (!view) return;
		try {
			if (action === 'join_video') {
				goto(`/video?id=${view.id}&role=doctor`);
				return;
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
				<button
					class="btn btn-sm"
					class:btn-primary={action === 'confirm' || action === 'join_video'}
					class:btn-danger={action === 'cancel' || action === 'reject'}
					type="button"
					onclick={() => act(action)}>{action.replace('_', ' ')}</button
				>
			{/each}
		</div>
		<p style="margin-top:1rem"><a href="/doctor/dashboard">← Queue</a></p>
	</div>
	<ExternalSystemLinks
		practiceId={view.practiceId}
		doctorId={view.doctorId}
		title="Open in your booking / telemedicine system"
	/>
{/if}
