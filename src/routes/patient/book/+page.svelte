<script lang="ts">
	import { goto } from '$app/navigation';
	import { availabilityService, practiceService } from '$lib/application/services';
	import { availability, bookingDraft } from '$lib/stores/app';
	import { dateStrip } from '$lib/domain/scheduling/slotCalendar';

	const strip = dateStrip(7);
	let selectedDate = $state(strip[0]?.iso ?? '');
	let selectedTime = $state<string | null>(null);

	let practice = $derived(
		$bookingDraft.practiceId ? practiceService.get($bookingDraft.practiceId) : null
	);
	let doctorName = $derived(
		practice?.doctors.find((d) => d.id === $bookingDraft.doctorId)?.name || practice?.name || 'Doctor'
	);

	let slots = $derived.by(() => {
		$availability;
		if (!$bookingDraft.practiceId) return [];
		return availabilityService.listBookable({
			practiceId: $bookingDraft.practiceId,
			doctorId: $bookingDraft.doctorId,
			fromDate: selectedDate,
			days: 1
		});
	});

	$effect(() => {
		if (!$bookingDraft.practiceId) goto('/patient/match');
	});

	function confirm() {
		if (!selectedTime || !$bookingDraft.practiceId) return;
		bookingDraft.update((d) => ({
			...d,
			slot: { date: selectedDate, time: selectedTime! }
		}));
		goto('/patient/book/confirm');
	}
</script>

<div class="page-header">
	<h1>Pick a slot</h1>
	<p class="sub">Only times {doctorName} has opened. The practice controls the calendar.</p>
</div>

<div class="date-strip">
	{#each strip as d}
		<button
			type="button"
			class="date-chip"
			class:active={d.iso === selectedDate}
			onclick={() => {
				selectedDate = d.iso;
				selectedTime = null;
			}}
		>
			<div class="day">{d.day}</div>
			<div class="num">{d.dateNum}</div>
		</button>
	{/each}
</div>

<div class="card">
	{#if slots.length === 0}
		<p class="empty-state">This doctor has not opened times on this day.</p>
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
		<a class="btn btn-ghost" href="/patient/match">Back</a>
	</div>
</div>
