<script lang="ts">
	import { goto } from '$app/navigation';
	import { appointmentService } from '$lib/application/services';
	import { bookingDraft } from '$lib/stores/app';
	import { dateStrip } from '$lib/domain/scheduling/slotCalendar';
	import type { Slot } from '$lib/domain/scheduling/slotCalendar';

	const strip = dateStrip(7);
	let selectedDate = $state(strip[0]?.iso ?? '');
	let selectedSlot = $state<Slot | null>(null);

	let slots = $derived(
		$bookingDraft.practiceId
			? appointmentService.openSlotsForPractice($bookingDraft.practiceId, selectedDate, 1)
			: []
	);

	$effect(() => {
		if (!$bookingDraft.practiceId) goto('/patient/match');
	});

	function confirm() {
		if (!selectedSlot || !$bookingDraft.practiceId) return;
		bookingDraft.update((d) => ({ ...d, slot: selectedSlot! }));
		goto('/patient/book/confirm');
	}
</script>

<div class="page-header">
	<h1>Pick a slot</h1>
	<p class="sub">Open times from practice hours minus booked appointments.</p>
</div>

<div class="date-strip">
	{#each strip as d}
		<button
			type="button"
			class="date-chip"
			class:active={d.iso === selectedDate}
			onclick={() => {
				selectedDate = d.iso;
				selectedSlot = null;
			}}
		>
			<div class="day">{d.day}</div>
			<div class="num">{d.dateNum}</div>
		</button>
	{/each}
</div>

<div class="card">
	{#if slots.length === 0}
		<p class="empty-state">No open slots this day.</p>
	{:else}
		<div class="slot-grid">
			{#each slots as s}
				<button
					type="button"
					class="slot-btn"
					class:selected={selectedSlot?.time === s.time && selectedSlot?.date === s.date}
					onclick={() => (selectedSlot = s)}>{s.time}</button
				>
			{/each}
		</div>
	{/if}
	<div class="actions">
		<button class="btn btn-primary" type="button" disabled={!selectedSlot} onclick={confirm}
			>Continue</button
		>
		<a class="btn btn-ghost" href="/patient/match">Back</a>
	</div>
</div>
