<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		matchingService,
		interestService,
		practiceService,
		factsService,
		PATIENT_PROFILE_PATH,
		DEMO_PATIENT_ID
	} from '$lib/application/services';
	import { bookingDraft, requirements, appointments } from '$lib/stores/app';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';
	import FactsCarousel from '$lib/components/facts/FactsCarousel.svelte';
	import ContactPracticeForm from '$lib/components/patient/ContactPracticeForm.svelte';
	import { languageLabel } from '$lib/domain/languages';
	import { MATCH_RESULT_MAX } from '$lib/domain/matching/matchDefaults';
	import type { MatchResult } from '$lib/domain/matching/matchingEngine';

	let email = $state('');
	let betaInterest = $state<'yes' | 'maybe' | 'no'>('maybe');
	let notice = $state('');

	let missing = $derived.by(() => {
		void $requirements;
		return matchingService.isPatientReady();
	});
	let results = $derived.by(() => {
		void $requirements;
		void $appointments;
		if (missing.length) return [];
		return matchingService.findMatches();
	});

	function pick(r: MatchResult) {
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

	function doctorName(practiceId: string, doctorId: string) {
		const practice = practiceService.get(practiceId);
		return practice?.doctors.find((d) => d.id === doctorId)?.name || 'Doctor';
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

	let factCards = $derived.by(() => {
		void $appointments;
		void $requirements;
		return factsService.forPatient(DEMO_PATIENT_ID);
	});
	let factHeading = $derived(
		$appointments.some(
			(a) =>
				a.patientId === DEMO_PATIENT_ID &&
				(a.status === 'requested' || a.status === 'confirmed')
		)
			? 'While you wait'
			: 'Before you book'
	);

	let criteriaBits = $derived(
		[
			$requirements.language ? languageLabel($requirements.language) : '',
			$requirements.specialty,
			$requirements.insurance === 'self_pay' || $requirements.insurance === 'private'
				? 'Selbstzahler'
				: $requirements.insurance,
			$requirements.location || $requirements.city,
			$requirements.postcode
		].filter(Boolean)
	);
</script>

<div class="page-header">
	<h1>Matches</h1>
	<p class="sub">
		Rule-based matches (language, specialty, insurance, open times, proximity). Showing up to
		{MATCH_RESULT_MAX} doctors — not a long unstructured list.
	</p>
</div>

<div class="card match-criteria">
	<div>
		<h3 style="margin:0 0 0.25rem">From your profile</h3>
		{#if criteriaBits.length}
			<p class="detail" style="margin:0">{criteriaBits.join(' · ')}</p>
		{:else}
			<p class="detail" style="margin:0">No match fields set yet.</p>
		{/if}
		{#if missing.length}
			<p class="detail" style="margin:0.35rem 0 0">Still needed: {missing.join(', ')}</p>
		{/if}
	</div>
	<a class="btn btn-ghost btn-sm" href={PATIENT_PROFILE_PATH}>Edit requirements</a>
</div>

{#if factCards.length}
	<FactsCarousel cards={factCards} heading={factHeading} compact />
{/if}

{#if missing.length}
	<div class="card">
		<h3>Complete your profile to see matches</h3>
		<p class="detail">Matching needs language, specialty, insurance, location, and new-patient.</p>
		<a class="btn btn-primary" href={PATIENT_PROFILE_PATH}>Open profile</a>
	</div>
{:else}
	<ExternalSystemLinks
		specialty={$requirements.specialty}
		location={$requirements.location}
		includeContext
		title="Also open Doctolib / telemedicine apps"
	/>
	{#if results.length === 0}
		<div class="card">
			<h3>No matches yet</h3>
			<p class="detail">
				Join the waitlist, or
				<a href={PATIENT_PROFILE_PATH}>change requirements</a>
				(specialty, city, language).
			</p>
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
		{#each results as r (r.practiceId + r.doctorId)}
			{@const practice = practiceService.get(r.practiceId)}
			{@const docName = doctorName(r.practiceId, r.doctorId)}
			<div class="card">
				<div style="display:flex;justify-content:space-between;gap:0.5rem;flex-wrap:wrap">
					<h3>{docName}</h3>
					{#if r.nextSlot}
						<span class="badge confirmed">{r.nextSlot.date} {r.nextSlot.time}</span>
					{/if}
				</div>
				<p class="detail">{practice?.name} · {practice?.location}</p>
				<ul class="reasons">
					{#each r.reasons as reason}<li>{reason}</li>{/each}
				</ul>
				<div class="actions">
					<button class="btn btn-primary btn-sm" type="button" onclick={() => pick(r)}>Book here</button>
					<button
						class="btn btn-ghost btn-sm"
						type="button"
						onclick={() => notifyPractice(r.practiceId)}>Notify me when a slot opens</button
					>
				</div>
				<ContactPracticeForm compact practiceId={r.practiceId} doctorId={r.doctorId} />
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
