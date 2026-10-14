<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		matchingService,
		interestService,
		practiceService,
		factsService,
		visitPipeline,
		PATIENT_PROFILE_PATH,
		DEMO_PATIENT_ID
	} from '$lib/application/services';
	import { bookingDraft, requirements, appointments, preferences } from '$lib/stores/app';
	import { t, uiLanguage, type MessageKey } from '$lib/i18n';
	import FactsCarousel from '$lib/components/facts/FactsCarousel.svelte';
	import MatchResultCard from '$lib/components/patient/MatchResultCard.svelte';
	import { recommendationsForPatient } from '$lib/application/careRecommendations';
	import { leadFromPhrase, resolveLead, SYMPTOMS } from '$lib/domain/care/symptoms';
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
	let waitlistSymptomId = $state<string | null>(null);
	let phrase = $state('');
	let focusLeadId = $state<string | null>(null);
	let modalityOverride = $state<'either' | 'in_person' | 'video'>('either');

	let missing = $derived.by(() => {
		void $requirements;
		return matchingService.isPatientReady();
	});

	let effectiveReqs = $derived.by(() => {
		void $requirements;
		return {
			...$requirements,
			modality: modalityOverride === 'either' ? $requirements.modality : modalityOverride
		};
	});

	let recommendations = $derived.by(() => {
		void effectiveReqs;
		void $appointments;
		if (missing.length) return [];
		return recommendationsForPatient(effectiveReqs, $appointments);
	});

	let focusedLead = $derived.by(() => {
		if (focusLeadId) return resolveLead({ leadId: focusLeadId });
		if (phrase.trim()) return resolveLead({ phrase });
		return null;
	});

	let visibleRows = $derived.by(() => {
		if (!focusedLead) return recommendations;
		return recommendations.filter((r) => r.id === focusedLead.id);
	});

	function applyPhrase() {
		focusLeadId = leadFromPhrase(phrase);
	}

	function logVisit(r: MatchResult, symptomId: string) {
		const q = new URLSearchParams({
			practiceId: r.practiceId,
			doctorId: r.doctorId,
			symptomId
		});
		goto(`/patient/log?${q}`);
	}

	function pick(r: MatchResult, symptomId: string, reason: string, specialty: string) {
		const modality =
			modalityOverride !== 'either'
				? modalityOverride
				: effectiveReqs.modality === 'either'
					? SYMPTOMS.find((s) => s.id === symptomId)?.defaultModality || 'in_person'
					: effectiveReqs.modality;
		bookingDraft.set(
			visitPipeline.draftFromMatch({
				patient: { ...effectiveReqs, specialty },
				match: r,
				reason,
				symptomId,
				modality
			})
		);
		goto('/patient/book');
	}

	function doctorName(practiceId: string, doctorId: string) {
		const practice = practiceService.get(practiceId);
		return practice?.doctors.find((d) => d.id === doctorId)?.name || 'Doctor';
	}

	async function joinWaitlist(symptomId: string) {
		try {
			await interestService.registerInterest({
				email,
				intent: 'waitlist',
				betaInterest,
				symptomId,
				requirements: effectiveReqs
			});
			waitlistSymptomId = symptomId;
			notice = 'Your email is saved for this symptom.';
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
			$requirements.postcode,
			$requirements.preferredWindow && $requirements.preferredWindow !== 'any'
				? `Times: ${$requirements.preferredWindow}`
				: ''
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

{#if !missing.length}
	<div class="card">
		<div class="field">
			<label for="phrase">What is bothering you? (optional)</label>
			<input
				id="phrase"
				bind:value={phrase}
				placeholder="e.g. a rash, blurred vision…"
				onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPhrase())}
			/>
		</div>
		<div class="field">
			<label for="modality-override">Visit type for this match</label>
			<select id="modality-override" bind:value={modalityOverride}>
				<option value="either">Use profile / lead default</option>
				<option value="in_person">In person</option>
				<option value="video">Video</option>
			</select>
		</div>
		<div class="actions">
			<button class="btn btn-primary btn-sm" type="button" onclick={applyPhrase}>Find lead</button>
			{#if focusLeadId || phrase.trim()}
				<button
					class="btn btn-ghost btn-sm"
					type="button"
					onclick={() => {
						phrase = '';
						focusLeadId = null;
					}}>Show all leads</button
				>
			{/if}
		</div>
		{#if focusedLead}
			<p class="detail">Showing: {symptomText(focusedLead.id)}</p>
		{/if}
	</div>
{/if}

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
	{#if notice && !waitlistSymptomId}<p class="detail">{notice}</p>{/if}
	{#each visibleRows as rec (rec.id)}
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
			{:else if rec.matches.length}
				{#each rec.matches as m (m.doctorId)}
					<MatchResultCard
						result={m}
						practice={practiceService.get(m.practiceId)}
						doctorName={doctorName(m.practiceId, m.doctorId)}
						specialty={rec.specialty}
						location={$requirements.location}
						symptomId={rec.id}
						quiet={false}
						assigned={Boolean(
							rec.assigned &&
								rec.assigned.practiceId === m.practiceId &&
								rec.assigned.doctorId === m.doctorId
						)}
						onBook={() => pick(m, rec.id, symptomText(rec.id), rec.specialty)}
						onLog={() => logVisit(m, rec.id)}
					/>
				{/each}
			{:else}
				<div class="card symptom-empty">
					<p class="detail">{text('match.none')}</p>
					{#if waitlistSymptomId === rec.id}
						<p class="detail">{notice}</p>
					{:else}
						<div class="field">
							<label for={`email-${rec.id}`}>Email</label>
							<input
								id={`email-${rec.id}`}
								type="email"
								bind:value={email}
								placeholder="you@email.com"
							/>
						</div>
						<div class="field">
							<label for={`beta-${rec.id}`}>Try free beta?</label>
							<select id={`beta-${rec.id}`} bind:value={betaInterest}>
								<option value="yes">Yes</option>
								<option value="maybe">Maybe</option>
								<option value="no">No</option>
							</select>
						</div>
						<button class="btn btn-primary" type="button" onclick={() => joinWaitlist(rec.id)}
							>Save interest for this symptom</button
						>
					{/if}
				</div>
			{/if}
		</section>
	{/each}
{/if}
