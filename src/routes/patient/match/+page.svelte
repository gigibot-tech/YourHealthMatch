<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { matchingService, interestService, practiceService } from '$lib/application/services';
	import { bookingDraft, matchResults, requirements } from '$lib/stores/app';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';

	let loading = $state(true);
	let email = $state('');
	let betaInterest = $state<'yes' | 'maybe' | 'no'>('maybe');
	let notice = $state('');

	onMount(() => {
		const missing = matchingService.isPatientReady();
		if (missing.length) {
			goto('/patient/requirements');
			return;
		}
		const results = matchingService.findMatches();
		matchResults.set(results);
		loading = false;
	});

	function pick(r: { practiceId: string; doctorId?: string; score: number }) {
		bookingDraft.set({
			requirements: $requirements,
			practiceId: r.practiceId,
			doctorId: r.doctorId,
			matchScore: r.score,
			modality: $requirements.modality,
			reason: $requirements.specialty || 'Consultation'
		});
		goto('/patient/book');
	}

	async function joinWaitlist() {
		try {
			await interestService.registerInterest({
				email,
				intent: 'waitlist',
				betaInterest,
				requirements: $requirements
			});
			notice = 'You’re on the waitlist — we’ll notify you when matches appear.';
		} catch (e) {
			notice = e instanceof Error ? e.message : 'Could not join waitlist';
		}
	}

	async function notifyPractice(practiceId: string) {
		try {
			await interestService.registerInterest({
				email: email || 'notify@local.dev',
				intent: 'notify_match',
				practiceId,
				requirements: $requirements
			});
			notice = 'We’ll notify you when a slot opens at this practice.';
		} catch (e) {
			notice = e instanceof Error ? e.message : 'Could not save interest';
		}
	}
</script>

<div class="page-header">
	<h1>Matches</h1>
	<p class="sub">Ranked by language, specialty, insurance, location, and availability.</p>
</div>

{#if loading}
	<p class="detail">Finding practices…</p>
{:else}
	<ExternalSystemLinks
		specialty={$requirements.specialty}
		location={$requirements.location}
		includeContext
		title="Also open Doctolib / telemedicine apps"
	/>
	{#if $matchResults.length === 0}
	<div class="card">
		<h3>No matches yet</h3>
		<p class="detail">Join the waitlist (survey Q21f) — Yes or Maybe both welcome.</p>
		<div class="field">
			<label for="email">Email</label>
			<input id="email" type="email" bind:value={email} placeholder="you@email.com" />
		</div>
		<div class="field">
			<label for="beta">Try free beta?</label>
			<select id="beta" bind:value={betaInterest}>
				<option value="yes">Yes</option>
				<option value="maybe">Maybe</option>
				<option value="no">No</option>
			</select>
		</div>
		<button class="btn btn-primary" type="button" onclick={joinWaitlist}>Join waitlist</button>
		{#if notice}<p class="detail">{notice}</p>{/if}
	</div>
{:else}
	{#if notice}<p class="detail">{notice}</p>{/if}
	{#each $matchResults as r}
		{@const practice = practiceService.get(r.practiceId)}
		<div class="card">
			<div style="display:flex;justify-content:space-between;gap:0.5rem;flex-wrap:wrap">
				<h3>{practice?.name ?? r.practiceId}</h3>
				<span class="badge confirmed">{r.score}% fit</span>
			</div>
			<p class="detail">{practice?.location} · {practice?.languages?.join(', ')}</p>
			<ul class="reasons">
				{#each r.reasons as reason}<li>{reason}</li>{/each}
			</ul>
			<div class="actions">
				<button class="btn btn-primary btn-sm" type="button" onclick={() => pick(r)}>Book here</button>
				<button class="btn btn-ghost btn-sm" type="button" onclick={() => notifyPractice(r.practiceId)}
					>Notify me when a slot opens</button
				>
			</div>
			<ExternalSystemLinks
				compact
				practiceId={r.practiceId}
				doctorId={r.doctorId}
				specialty={$requirements.specialty}
				location={$requirements.location}
			/>
		</div>
	{/each}
	{/if}
{/if}
