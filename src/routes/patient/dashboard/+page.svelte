<script lang="ts">
	import { appointmentService } from '$lib/application/services';
	import { appointments } from '$lib/stores/app';
	import { practiceService } from '$lib/application/services';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';
	import { goto } from '$app/navigation';

	let views = $derived(
		$appointments
			.filter((a) => a.patientId === 'pat_demo')
			.map((a) => appointmentService.view(a, 'patient'))
	);

	async function act(id: string, action: 'cancel' | 'join_video') {
		try {
			if (action === 'join_video') {
				goto(`/video?id=${id}&role=patient`);
				return;
			}
			await appointmentService.applyAction(id, action, 'patient');
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Action failed');
		}
	}
</script>

<div class="page-header">
	<h1>Your appointments</h1>
	<p class="sub">Actions come from allowedActions — not inline status ifs.</p>
</div>

<ExternalSystemLinks onlySaved title="Your saved booking / telemedicine apps" />

{#if views.length === 0}
	<div class="empty-state">No appointments yet. <a href="/patient/match">Find a match</a></div>
{:else}
	{#each views as v}
		{@const practice = practiceService.get(v.practiceId)}
		<div class="card">
			<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
				<h3>{practice?.name ?? v.practiceId}</h3>
				<span class="badge {v.badge}">{v.label}</span>
			</div>
			<p class="detail">{v.date} · {v.time} · {v.reason}</p>
			<div class="actions">
				{#each v.allowedActions as action}
					{#if action === 'cancel'}
						<button class="btn btn-danger btn-sm" type="button" onclick={() => act(v.id, 'cancel')}
							>Cancel</button
						>
					{:else if action === 'join_video'}
						<button class="btn btn-primary btn-sm" type="button" onclick={() => act(v.id, 'join_video')}
							>Join video</button
						>
					{/if}
				{/each}
			</div>
			<ExternalSystemLinks compact practiceId={v.practiceId} doctorId={v.doctorId} />
		</div>
	{/each}
{/if}
