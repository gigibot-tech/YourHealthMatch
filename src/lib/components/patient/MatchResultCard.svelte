<script lang="ts">
	import ContactPracticeForm from '$lib/components/patient/ContactPracticeForm.svelte';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';
	import { CHANNEL_TO_SYSTEM } from '$lib/domain/externalSystems/catalog';
	import { formatNextOpening } from '$lib/domain/matching/matchRules';
	import type { MatchResult } from '$lib/domain/matching/matchingEngine';
	import type { Practice } from '$lib/domain/practice/practiceProfileDefaults';

	let {
		result,
		practice,
		doctorName,
		specialty = '',
		location = '',
		quiet = false,
		onBook,
		onLog
	}: {
		result: MatchResult;
		practice: Practice | undefined;
		doctorName: string;
		specialty?: string;
		location?: string;
		/** Hide the rule list. The symptom above the card is the reason. */
		quiet?: boolean;
		onBook: () => void;
		onLog: () => void;
	} = $props();

	let booksElsewhere = $derived(
		Boolean(practice?.bookingChannel && CHANNEL_TO_SYSTEM[practice.bookingChannel])
	);

	let opening = $derived(result.nextSlot ? formatNextOpening(result.nextSlot) : '');
</script>

<article class="card match-card">
	<header class="match-card__head">
		<h3>{doctorName}</h3>
		{#if opening}<p class="match-card__when">{opening}</p>{/if}
	</header>
	<p class="detail match-card__where">{practice?.name} · {practice?.location}</p>
	{#if !quiet}
		<ul class="match-facts">
			{#each result.reasons as fact}
				<li>{fact}</li>
			{/each}
		</ul>
	{/if}
	<div class="actions">
		{#if booksElsewhere}
			<ExternalSystemLinks
				compact
				practiceOnly
				practiceId={result.practiceId}
				doctorId={result.doctorId}
				doctorName={doctorName}
				{specialty}
				{location}
			/>
			<button class="btn btn-ghost btn-sm" type="button" onclick={onLog}
				>I booked there — log it</button
			>
		{:else}
			<button class="btn btn-primary btn-sm" type="button" onclick={onBook}>Book here</button>
		{/if}
	</div>
	<ContactPracticeForm compact practiceId={result.practiceId} doctorId={result.doctorId} />
</article>
