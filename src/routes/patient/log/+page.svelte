<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { practiceService, visitPipeline, DEMO_PATIENT_ID } from '$lib/application/services';
	import { requirements } from '$lib/stores/app';
	import { toISODate } from '$lib/domain/scheduling/slotCalendar';

	let practiceId = $derived($page.url.searchParams.get('practiceId') || '');
	let doctorId = $derived($page.url.searchParams.get('doctorId') || '');
	let practice = $derived(practiceId ? practiceService.get(practiceId) : undefined);
	let doctor = $derived(practice?.doctors.find((d) => d.id === doctorId));

	let date = $state(toISODate(new Date()));
	let time = $state('10:00');
	let reason = $state($requirements.specialty || 'Consultation');
	let modality = $state<'video' | 'in_person'>(
		$requirements.modality === 'video' ? 'video' : 'in_person'
	);
	let error = $state('');

	function save(e: Event) {
		e.preventDefault();
		error = '';
		if (!practice || !doctor) {
			error = 'Choose a practice from Match first.';
			return;
		}
		try {
			visitPipeline.logExternal({
				practiceId: practice.id,
				doctorId: doctor.id,
				date,
				time,
				reason,
				modality,
				requirements: {
					...$requirements,
					specialty: doctor.specialty || $requirements.specialty
				},
				patientId: DEMO_PATIENT_ID,
				patientName: 'John Doe'
			});
			goto('/patient/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not log the visit';
		}
	}
</script>

<div class="page-header">
	<div>
		<h1>Log an appointment</h1>
		<p class="sub">
			You booked this outside YourHealthMatch. Record the time so it shows with your other visits.
		</p>
	</div>
</div>

{#if !practice || !doctor}
	<div class="card">
		<p>Open this from a match that books on another app.</p>
		<a class="btn btn-primary" href="/patient/match">Back to matches</a>
	</div>
{:else}
	<form class="card log-visit" onsubmit={save}>
		<p><strong>{doctor.name}</strong></p>
		<p class="detail">{practice.name} · {practice.location}</p>
		<div class="field">
			<label for="log-date">Date</label>
			<input id="log-date" type="date" bind:value={date} required />
		</div>
		<div class="field">
			<label for="log-time">Time</label>
			<input id="log-time" type="time" step="1800" bind:value={time} required />
		</div>
		<div class="field">
			<label for="log-reason">Reason</label>
			<input id="log-reason" bind:value={reason} required />
		</div>
		<div class="field">
			<label for="log-type">Visit type</label>
			<select id="log-type" bind:value={modality}>
				<option value="in_person">In person</option>
				<option value="video">Video</option>
			</select>
		</div>
		{#if error}<p class="detail log-error">{error}</p>{/if}
		<div class="actions">
			<button class="btn btn-primary" type="submit">Save on my visits</button>
			<a class="btn btn-ghost" href="/patient/match">Back</a>
		</div>
	</form>
{/if}

<style>
	.log-visit {
		max-width: 28rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.log-error {
		color: var(--color-danger);
	}
</style>
