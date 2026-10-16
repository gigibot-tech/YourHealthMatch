<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		matchingService,
		interestService,
		practiceService,
		factsService,
		visitPipeline,
		PATIENT_PROFILE_PATH,
		activePatientId
	} from '$lib/application/services';
	import { bookingDraft, requirements, appointments, preferences } from '$lib/stores/app';
	import { t, uiLanguage, type MessageKey } from '$lib/i18n';
	import FactsCarousel from '$lib/components/facts/FactsCarousel.svelte';
	import MatchResultCard from '$lib/components/patient/MatchResultCard.svelte';
	import { recommendationsForPatient } from '$lib/application/careRecommendations';
	import { leadFromPhrase, resolveLead, SYMPTOMS } from '$lib/domain/care/symptoms';
	import { languageLabel } from '$lib/domain/languages';
	import { deliverMatchInterest } from '$lib/adapters/matchInterestNotice';
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
	let notice = $state('');
	let waitlistSymptomId = $state<string | null>(null);
	let sendingInterest = $state(false);
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
		if (sendingInterest) return;
		sendingInterest = true;
		notice = '';
		try {
			const interest = await interestService.registerInterest({
				email,
				intent: 'waitlist',
				symptomId,
				note: symptomText(symptomId),
				requirements: effectiveReqs
			});
			const delivered = await deliverMatchInterest(interest, symptomText(symptomId));
			if (delivered !== 'emailed') {
				notice = text('match.interestFailed');
				return;
			}
			waitlistSymptomId = symptomId;
			notice = text('match.interestSent');
			email = '';
		} catch (e) {
			notice = e instanceof Error ? e.message : text('match.interestFailed');
		} finally {
			sendingInterest = false;
		}
	}

	let factCards = $derived.by(() => {
		void $appointments;
		void $requirements;
		return factsService.forPatient(activePatientId());
	});
	let hasUpcoming = $derived(
		$appointments.some(
			(a) =>
				a.patientId === activePatientId() &&
				(a.status === 'requested' || a.status === 'confirmed')
		)
	);

	function insuranceLabel(code: string) {
		if (code === 'GKV') return text('match.insuranceGkv');
		if (code === 'PKV') return text('match.insurancePkv');
		if (code === 'self_pay' || code === 'private') return text('match.insuranceSelfPay');
		return code;
	}

	let promiseBits = $derived(
		[
			$requirements.language ? languageLabel($requirements.language) : '',
			$requirements.location || $requirements.city,
			$requirements.insurance ? insuranceLabel($requirements.insurance) : ''
		].filter(Boolean)
	);

	function promiseLinesFor(practiceId: string) {
		const practice = practiceService.get(practiceId);
		if (!practice) return promiseBits;
		const langs = (practice.languages ?? [])
			.map((code) => languageLabel(code))
			.filter(Boolean)
			.join(' · ');
		return [
			langs || ($requirements.language ? languageLabel($requirements.language) : ''),
			practice.location || $requirements.location || $requirements.city,
			$requirements.insurance ? insuranceLabel($requirements.insurance) : ''
		].filter(Boolean);
	}
</script>

<div class="page-header">
	<h1>{text('match.title')}</h1>
	<p class="sub">{text('match.sub')}</p>
</div>

<div class="card match-criteria match-promise-panel">
	<div>
		<h3 style="margin:0 0 0.35rem">{text('match.promiseTitle')}</h3>
		{#if promiseBits.length}
			{#each promiseBits as bit}
				<p class="match-promise-line">{bit}</p>
			{/each}
			<p class="detail match-promise-caption">{text('match.promiseCaption')}</p>
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
						promiseTitle={text('match.promiseTitle')}
						promiseLines={promiseLinesFor(m.practiceId)}
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
						<form
							onsubmit={(event) => {
								event.preventDefault();
								joinWaitlist(rec.id);
							}}
						>
							<div class="field">
								<label for={`email-${rec.id}`}>{text('match.interestEmail')}</label>
								<input
									id={`email-${rec.id}`}
									type="email"
									required
									bind:value={email}
									placeholder="you@email.com"
								/>
							</div>
							<button class="btn btn-primary" type="submit" disabled={sendingInterest}>
								{text('match.interestSend')}
							</button>
							{#if notice && waitlistSymptomId !== rec.id}
								<p class="detail">{notice}</p>
							{/if}
						</form>
					{/if}
				</div>
			{/if}
		</section>
	{/each}
{/if}

<style>
	.match-promise-panel {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
	}
	.match-promise-line {
		margin: 0.15rem 0;
		color: #1c2433;
		font-weight: 600;
	}
	.match-promise-caption {
		margin: 0.65rem 0 0;
		max-width: 48ch;
		line-height: 1.45;
	}
</style>
