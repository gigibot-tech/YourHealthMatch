<script lang="ts">
	import { appointmentService } from '$lib/application/services';
	import { appointments } from '$lib/stores/app';
	import { dateStrip } from '$lib/domain/scheduling/slotCalendar';
	import { goto } from '$app/navigation';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';

	const practiceId = 'prac_turner';
	const strip = dateStrip(7);
	let selectedDate = $state(strip[0]?.iso ?? '');

	let list = $derived(
		$appointments
			.filter(
				(a) =>
					a.practiceId === practiceId &&
					a.date === selectedDate &&
					a.status !== 'cancelled' &&
					a.status !== 'rejected'
			)
			.map((a) => appointmentService.view(a, 'doctor'))
	);

	async function act(id: string, action: 'confirm' | 'complete' | 'join_video') {
		try {
			if (action === 'join_video') {
				goto(`/video?id=${id}&role=doctor`);
				return;
			}
			await appointmentService.applyAction(id, action, 'doctor');
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Failed');
		}
	}
</script>

<div class="page-header">
	<h1>Schedule</h1>
	<p class="sub">Clinic calendar — day view of booked visits.</p>
</div>

<div class="date-strip">
	{#each strip as d}
		<button
			type="button"
			class="date-chip"
			class:active={d.iso === selectedDate}
			onclick={() => (selectedDate = d.iso)}
		>
			<div class="day">{d.day}</div>
			<div class="num">{d.dateNum}</div>
		</button>
	{/each}
</div>

{#if list.length === 0}
	<div class="empty-state">No appointments this day.</div>
{:else}
	{#each list as v}
		<div class="card">
			<div style="display:flex;gap:0.5rem;align-items:center">
				<h3>{v.patientName}</h3>
				<span class="badge {v.badge}">{v.label}</span>
			</div>
			<p class="detail">{v.time} · {v.reason}</p>
			<div class="actions">
				{#each v.allowedActions as action}
					{#if action === 'confirm'}
						<button class="btn btn-primary btn-sm" type="button" onclick={() => act(v.id, 'confirm')}
							>Confirm</button
						>
					{:else if action === 'complete'}
						<button class="btn btn-sm" type="button" onclick={() => act(v.id, 'complete')}
							>Complete</button
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
