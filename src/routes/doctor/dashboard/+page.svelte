<script lang="ts">
	import { appointmentService } from '$lib/application/services';
	import { appointments, role } from '$lib/stores/app';
	import { practiceService } from '$lib/application/services';
	import { goto } from '$app/navigation';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';

	$effect(() => {
		if ($role !== 'doctor') role.set('doctor');
	});

	const practiceId = 'prac_turner';
	let queue = $derived(
		$appointments
			.filter((a) => a.practiceId === practiceId && a.status === 'requested')
			.map((a) => appointmentService.view(a, 'doctor'))
	);

	async function act(id: string, action: 'confirm' | 'reject' | 'cancel') {
		try {
			await appointmentService.applyAction(id, action, 'doctor');
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Failed');
		}
	}
</script>

<div class="page-header">
	<h1>Request queue</h1>
	<p class="sub">{practiceService.get(practiceId)?.name} — confirm or decline requests.</p>
</div>

{#if queue.length === 0}
	<div class="empty-state">No pending requests.</div>
{:else}
	{#each queue as v}
		<div class="card">
			<div style="display:flex;gap:0.5rem;align-items:center">
				<h3>{v.patientName}</h3>
				<span class="badge {v.badge}">{v.label}</span>
			</div>
			<p class="detail">{v.date} · {v.time} · {v.reason}</p>
			<div class="actions">
				{#each v.allowedActions as action}
					{#if action === 'confirm'}
						<button class="btn btn-primary btn-sm" type="button" onclick={() => act(v.id, 'confirm')}
							>Confirm</button
						>
					{:else if action === 'reject'}
						<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(v.id, 'reject')}
							>Decline</button
						>
					{:else if action === 'cancel'}
						<button class="btn btn-danger btn-sm" type="button" onclick={() => act(v.id, 'cancel')}
							>Cancel</button
						>
					{/if}
				{/each}
				<a class="btn btn-ghost btn-sm" href={`/doctor/appointment/${v.id}`}>Details</a>
			</div>
			<ExternalSystemLinks compact practiceId={v.practiceId} doctorId={v.doctorId} />
		</div>
	{/each}
{/if}
