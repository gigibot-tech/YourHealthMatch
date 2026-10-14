<script lang="ts">
	import { practiceService, visitPipeline, type BookingDraft } from '$lib/application/services';
	import { bookingDraft } from '$lib/stores/app';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';
	import type { Appointment } from '$lib/domain/appointment/Appointment';

	let error = $state('');
	let booked = $state<Appointment | null>(null);

	const practice = $derived(
		$bookingDraft.practiceId ? practiceService.get($bookingDraft.practiceId) : null
	);
	const doctorName = $derived(
		practice?.doctors.find((d) => d.id === $bookingDraft.doctorId)?.name
	);

	function book() {
		const d = $bookingDraft;
		if (!d.practiceId || !d.slot || !d.requirements) {
			error = 'Incomplete booking draft';
			return;
		}
		try {
			const appt = visitPipeline.book(d as BookingDraft);
			booked = appt;
			bookingDraft.set({});
			error = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Booking failed';
		}
	}

	function downloadCalendar() {
		if (!booked) return;
		visitPipeline.downloadIcs(booked);
	}
</script>

<div class="page-header">
	<h1>Confirm booking</h1>
	<p class="sub">Your slot is held for five minutes. Request it here to finalize.</p>
</div>

{#if booked}
	<div class="card">
		<h3>Appointment requested</h3>
		<p class="detail">{booked.date} · {booked.time} · {booked.modality}</p>
		<div class="actions">
			<button class="btn btn-primary" type="button" onclick={downloadCalendar}
				>Download calendar (.ics)</button
			>
			<a class="btn btn-ghost" href={`/patient/dashboard?booked=${booked.id}`}>Go to visits</a>
		</div>
	</div>
{:else}
	<div class="card">
		<p><strong>{practice?.name}</strong>{doctorName ? ` · ${doctorName}` : ''}</p>
		<p class="detail">
			{$bookingDraft.slot?.date} · {$bookingDraft.slot?.time} · {$bookingDraft.modality}
		</p>
		{#if error}<p style="color:var(--danger)">{error}</p>{/if}
		<div class="actions">
			<button class="btn btn-primary" type="button" onclick={book}>Request appointment here</button>
			<a class="btn btn-ghost" href="/patient/book">Back</a>
		</div>
	</div>

	{#if $bookingDraft.practiceId}
		<ExternalSystemLinks
			practiceId={$bookingDraft.practiceId}
			doctorId={$bookingDraft.doctorId}
			specialty={$bookingDraft.requirements?.specialty}
			location={$bookingDraft.requirements?.location}
			title="Or continue in their booking / telemedicine app"
		/>
	{/if}
{/if}
