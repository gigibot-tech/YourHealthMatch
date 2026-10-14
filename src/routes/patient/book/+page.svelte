<script lang="ts">
	import { goto } from '$app/navigation';
	import { practiceService, visitPipeline, activePatientId } from '$lib/application/services';
	import { availability, bookingDraft, requirements } from '$lib/stores/app';
	import { toISODate } from '$lib/domain/scheduling/slotCalendar';
	import MonthCalendar from '$lib/components/scheduling/MonthCalendar.svelte';

	let selectedDate = $state(toISODate(new Date()));
	let selectedTime = $state<string | null>(null);
	let holdNotice = $state('');

	let practice = $derived(
		$bookingDraft.practiceId ? practiceService.get($bookingDraft.practiceId) : null
	);
	let doctorName = $derived(
		practice?.doctors.find((d) => d.id === $bookingDraft.doctorId)?.name || practice?.name || 'Doctor'
	);

	let slots = $derived.by(() => {
		$availability;
		if (!$bookingDraft.practiceId) return [];
		return practiceService.listBookable({
			practiceId: $bookingDraft.practiceId,
			doctorId: $bookingDraft.doctorId,
			fromDate: selectedDate,
			days: 1,
			preferredWindow: $requirements.preferredWindow,
			holderId: activePatientId()
		});
	});

	$effect(() => {
		if (!$bookingDraft.practiceId) goto('/patient/match');
	});

	function releaseCurrentHold() {
		const d = $bookingDraft;
		if (d.practiceId && d.doctorId && d.slot) {
			practiceService.releaseHold({
				practiceId: d.practiceId,
				doctorId: d.doctorId,
				date: d.slot.date,
				time: d.slot.time,
				holderId: activePatientId()
			});
		}
	}

	function backToMatch() {
		releaseCurrentHold();
		bookingDraft.set({});
		goto('/patient/match');
	}

	function confirm() {
		if (!selectedTime || !$bookingDraft.practiceId) return;
		try {
			if ($bookingDraft.slot) releaseCurrentHold();
			const next = visitPipeline.withSlot(
				$bookingDraft,
				{ date: selectedDate, time: selectedTime },
				activePatientId()
			);
			bookingDraft.set(next);
			holdNotice = 'Time held for 5 minutes while you confirm.';
			goto('/patient/book/confirm');
		} catch (e) {
			holdNotice = e instanceof Error ? e.message : 'Could not hold that time';
		}
	}
</script>

<div class="page-header">
	<h1>Pick a slot</h1>
	<p class="sub">
		Only times {doctorName} has opened that fit your availability.
		{#if $requirements.preferredWindow && $requirements.preferredWindow !== 'any'}
			Bands: {$requirements.preferredWindow}.
		{/if}
	</p>
</div>

<MonthCalendar
	bind:value={selectedDate}
	onSelect={() => {
		selectedTime = null;
	}}
/>

<div class="card">
	{#if holdNotice}<p class="detail">{holdNotice}</p>{/if}
	{#if slots.length === 0}
		<p class="empty-state">No open times on this day in your preferred windows.</p>
	{:else}
		<div class="slot-grid">
			{#each slots as s}
				<button
					type="button"
					class="slot-btn"
					class:selected={selectedTime === s.time}
					onclick={() => (selectedTime = s.time)}>{s.time}</button
				>
			{/each}
		</div>
	{/if}
	<div class="actions">
		<button class="btn btn-primary" type="button" disabled={!selectedTime} onclick={confirm}
			>Continue</button
		>
		<button class="btn btn-ghost" type="button" onclick={backToMatch}>Back</button>
	</div>
</div>
