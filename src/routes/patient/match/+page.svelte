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
	import { bookingDraft, requirements, appointments, preferences } from '$lib/stores/app';
	import { t, uiLanguage, type MessageKey } from '$lib/i18n';
	import FactsCarousel from '$lib/components/facts/FactsCarousel.svelte';
	import MatchResultCard from '$lib/components/patient/MatchResultCard.svelte';
	import { recommendationsForPatient } from '$lib/application/careRecommendations';
	import { languageLabel } from '$lib/domain/languages';
	import type { MatchResult } from '$lib/domain/matching/matchingEngine';

	let lang = $derived(uiLanguage($preferences.language));
	function text(key: MessageKey) {
		return t(lang, key);
	}
	function symptomText(id: string) {
		if (id === 'unwell' || id === 'vision' || id === 'skin') return text(`symptom.${id}`);
		return id;
	}

	let email = $state('');
	let betaInterest = $state<'yes' | 'maybe' | 'no'>('maybe');
	let notice = $state('');

	let missing = $derived.by(() => {
		void $requirements;
		return matchingService.isPatientReady();
	});
	let recommendations = $derived.by(() => {
		void $requirements;
		void $appointments;
		if (missing.length) return [];
		return recommendationsForPatient($requirements, $appointments);
	});

	function logVisit(r: MatchResult) {
		const q = new URLSearchParams({
			practiceId: r.practiceId,
			doctorId: r.doctorId
		});
		goto(`/patient/log?${q}`);
	}

	function pick(r: MatchResult, reason: string) {
		bookingDraft.set({
			requirements: { ...$requirements, specialty: reason },
			practiceId: r.practiceId,
			doctorId: r.doctorId,
			matchScore: r.score,
			modality: $requirements.modality,
			reason
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
			notice = 'Your email is saved on the waitlist.';
		} catch (e) {
			notice = e instanceof Error ? e.message : 'Could not join waitlist';
		}
	}

	let factCards = $derived.by(() => {
		void $appointments;
		void $requirements;
		return factsService.forPatient(DEMO_PATIENT_ID);
	});
	let hasUpcoming = $derived(
		$appointments.some(
			(a) =>
				a.patientId === DEMO_PATIENT_ID &&
				(a.status === 'requested' || a.status === 'confirmed')
		)
	);

	let criteriaBits = $derived(
		[
			$requirements.language ? languageLabel($requirements.language) : '',
			$requirements.insurance === 'self_pay' || $requirements.insurance === 'private'
				? 'Selbstzahler'
				: $requirements.insurance,
			$requirements.location || $requirements.city,
			$requirements.postcode
		].filter(Boolean)
	);
</script>

<div class="page-header">
	<h1>{text('match.title')}</h1>
	<p class="sub">{text('match.sub')}</p>
</div>

<div class="card match-criteria">
	<div>
		<h3 style="margin:0 0 0.25rem">{text('match.fromProfile')}</h3>
		{#if criteriaBits.length}
			<p class="detail" style="margin:0">{criteriaBits.join(' · ')}</p>
		{:else}
			<p class="detail" style="margin:0">No match fields set yet.</p>
		{/if}
		{#if missing.length}
			<p class="detail" style="margin:0.35rem 0 0">Still needed: {missing.join(', ')}</p>
		{/if}
	</div>
	<a class="btn btn-ghost btn-sm" href={PATIENT_PROFILE_PATH}>{text('match.edit')}</a>
</div>

{#if !hasUpcoming && factCards.length}
	<FactsCarousel cards={factCards} heading="Nothing booked yet" compact />
{/if}

{#if missing.length}
	<div class="card">
		<h3>{text('match.needTitle')}</h3>
		<p class="detail">{text('match.needBody')}</p>
		<a class="btn btn-primary" href={PATIENT_PROFILE_PATH}>Open profile</a>
	</div>
{:else}
	{#if recommendations.every((rec) => !rec.covered && !rec.match)}
		<div class="card">
			<h3>No one with an opening yet</h3>
			<p class="detail">
				Leave your email, or
				<a href={PATIENT_PROFILE_PATH}>change city or language</a>.
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
		{#each recommendations as rec (rec.id)}
			<section class="symptom-block" aria-labelledby={`symptom-${rec.id}`}>
				<h2 id={`symptom-${rec.id}`} class="symptom-label">{symptomText(rec.id)}</h2>
				{#if rec.covered}
					<div class="card symptom-covered">
						<p class="detail">{text('match.covered')}</p>
						<h3>{rec.covered.doctorName}</h3>
						<p class="detail">
							{rec.covered.practiceName} · {rec.covered.date} {rec.covered.time}
						</p>
					</div>
				{:else if rec.match}
					<MatchResultCard
						result={rec.match}
						practice={practiceService.get(rec.match.practiceId)}
						doctorName={doctorName(rec.match.practiceId, rec.match.doctorId)}
						location={$requirements.location}
						quiet
						onBook={() => pick(rec.match!, symptomText(rec.id))}
						onLog={() => logVisit(rec.match!)}
					/>
				{:else}
					<p class="detail">{text('match.none')}</p>
				{/if}
			</section>
		{/each}
	{/if}
{/if}
