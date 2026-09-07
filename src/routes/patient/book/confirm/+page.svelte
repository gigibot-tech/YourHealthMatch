<script lang="ts">
	import { goto } from '$app/navigation';
	import { appointmentService, type BookingDraft } from '$lib/application/services';
	import { bookingDraft } from '$lib/stores/app';
	import { practiceService } from '$lib/application/services';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';

	let error = $state('');

	function book() {
		const d = $bookingDraft;
		if (!d.practiceId || !d.slot || !d.requirements) {
			error = 'Incomplete booking draft';
			return;
		}
		try {
			const appt = appointmentService.book(d as BookingDraft);
			bookingDraft.set({});
			goto(`/patient/dashboard?booked=${appt.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Booking failed';
		}
	}

	const practice = $derived(
		$bookingDraft.practiceId ? practiceService.get($bookingDraft.practiceId) : null
	);
	const doctorName = $derived(
		practice?.doctors.find((d) => d.id === $bookingDraft.doctorId)?.name
	);
</script>

<div class="page-header">
	<h1>Confirm booking</h1>
	<p class="sub">Book here — or open the practice’s app if they use Doctolib / telemedicine.</p>
</div>

<div class="card">
	<p><strong>{practice?.name}</strong>{doctorName ? ` · ${doctorName}` : ''}</p>
	<p class="detail">
		{$bookingDraft.slot?.date} · {$bookingDraft.slot?.time} · {$bookingDraft.modality}
	</p>
	<p class="detail">Match score: {$bookingDraft.matchScore}</p>
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
