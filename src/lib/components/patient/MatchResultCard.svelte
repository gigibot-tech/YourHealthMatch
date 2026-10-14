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
		symptomId = '',
		quiet = false,
		assigned = false,
		promiseTitle = '',
		promiseLines = [],
		onBook,
		onLog
	}: {
		result: MatchResult;
		practice: Practice | undefined;
		doctorName: string;
		specialty?: string;
		location?: string;
		symptomId?: string;
		/** Hide the rule list. The symptom above the card is the reason. */
		quiet?: boolean;
		/** Saved Stamm doctor for this specialty. */
		assigned?: boolean;
		promiseTitle?: string;
		promiseLines?: string[];
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
		{#if assigned}<p class="detail match-card__assigned">Your doctor for this specialty</p>{/if}
		{#if opening}<p class="match-card__when">{opening}</p>{/if}
	</header>
	<p class="detail match-card__where">{practice?.name} · {practice?.location}</p>
	{#if promiseTitle && promiseLines.length}
		<div class="match-promise">
			<p class="match-promise__title">{promiseTitle}</p>
			{#each promiseLines as line}
				<p>{line}</p>
			{/each}
		</div>
	{/if}
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
	<ContactPracticeForm
		compact
		practiceId={result.practiceId}
		doctorId={result.doctorId}
		{symptomId}
	/>
</article>

<style>
	.match-promise {
		margin: 0.75rem 0 0.35rem;
		padding: 0.65rem 0 0.65rem 0.85rem;
		border-left: 3px solid #203b73;
		color: #3e4c63;
		line-height: 1.45;
	}
	.match-promise__title {
		margin: 0 0 0.35rem;
		color: #203b73;
		font-weight: 700;
	}
	.match-promise p {
		margin: 0.15rem 0;
	}
</style>
