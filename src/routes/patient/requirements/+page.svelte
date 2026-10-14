<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { preferences, requirements, patchRequirements } from '$lib/stores/app';
	import { t, uiLanguage } from '$lib/i18n';
	import { matchingService } from '$lib/application/services';
	import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
	import { normalizeLanguageCode } from '$lib/domain/languages';
	import {
		parsePreferredWindow,
		serializePreferredWindow,
		TIME_BANDS,
		type TimeBandId
	} from '$lib/domain/scheduling/timeWindows';
	import LanguageSelect from '$lib/components/i18n/LanguageSelect.svelte';
	import SkipOnboardingButton from '$lib/components/session/SkipOnboardingButton.svelte';
	import SystemsPrefs from '$lib/components/patient/SystemsPrefs.svelte';

	let lang = $derived(uiLanguage($preferences.language));

	let form = $state({
		...$requirements,
		language: normalizeLanguageCode($requirements.language) || $requirements.language
	});
	let bands = $state<TimeBandId[]>(parsePreferredWindow($requirements.preferredWindow));

	onMount(() => {
		const id = window.location.hash.replace('#', '');
		if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	});

	function toggleBand(id: TimeBandId) {
		if (id === 'any') {
			bands = ['any'];
			return;
		}
		const withoutAny = bands.filter((b) => b !== 'any');
		if (withoutAny.includes(id)) {
			const next = withoutAny.filter((b) => b !== id);
			bands = next.length ? next : ['any'];
		} else {
			bands = [...withoutAny, id];
		}
	}

	let savedNote = $state('');

	function save(e: Event) {
		e.preventDefault();
		const language = normalizeLanguageCode(form.language) || form.language;
		if (language) preferences.set({ language });
		const saved = patchRequirements({
			...form,
			language,
			preferredWindow: serializePreferredWindow(bands)
		} as Partial<PatientRequirements>);
		const missing = matchingService.isPatientReady(saved);
		if (missing.length) {
			savedNote = '';
			alert(`Still needed: ${missing.join(', ')}`);
			return;
		}
		savedNote = t(lang, 'profile.saved');
		goto('/patient/match');
	}
</script>

<div class="page-header">
	<p class="demo-kicker">{t(lang, 'profile.demoTitle')}</p>
	<h1>{t(lang, 'profile.title')}</h1>
	<p class="demo-banner">{t(lang, 'profile.demoBody')}</p>
	<p class="sub">{t(lang, 'profile.sub')}</p>
</div>

<form class="card" id="requirements" onsubmit={save}>
	<h2 class="section-title" style="margin-top:0">{t(lang, 'profile.about')}</h2>
	<div id="language">
		<LanguageSelect id="lang" bind:value={form.language} required label="Preferred language" />
	</div>
	<div class="field-row">
		<div class="field">
			<label for="insurance">Insurance type</label>
			<select id="insurance" bind:value={form.insurance} required>
				<option value="">Select…</option>
				<option value="GKV">GKV</option>
				<option value="PKV">PKV</option>
				<option value="self_pay">Selbstzahler</option>
			</select>
		</div>
		<div class="field">
			<label for="krankenkasse">Krankenkasse (optional)</label>
			<input id="krankenkasse" bind:value={form.krankenkasse} placeholder="e.g. TK" />
		</div>
	</div>
	<div class="field-row">
		<div class="field">
			<label for="location">City / area</label>
			<input id="location" bind:value={form.location} required placeholder="Greifswald" />
		</div>
		<div class="field">
			<label for="postcode">PLZ</label>
			<input id="postcode" bind:value={form.postcode} placeholder="17489" />
		</div>
	</div>
	<div class="field">
		<label for="newPatient">New patient?</label>
		<select
			id="newPatient"
			value={form.newPatient === null ? '' : String(form.newPatient)}
			onchange={(e) => {
				const v = (e.currentTarget as HTMLSelectElement).value;
				form.newPatient = v === '' ? null : v === 'true';
			}}
			required
		>
			<option value="">Select…</option>
			<option value="true">Yes</option>
			<option value="false">No</option>
		</select>
	</div>
	<div class="field">
		<label for="modality">Visit type</label>
		<select id="modality" bind:value={form.modality}>
			<option value="either">Either</option>
			<option value="in_person">In person</option>
			<option value="video">Video</option>
		</select>
	</div>
	<div class="field" id="time-bands">
		<span class="field-label">When can you go?</span>
		<p class="detail">{t(lang, 'profile.times')}</p>
		{#each TIME_BANDS as band}
			<label>
				<input
					type="checkbox"
					checked={bands.includes(band.id)}
					onchange={() => toggleBand(band.id)}
				/>
				{band.label}
			</label>
		{/each}
	</div>
	{#if ($requirements.assignedDoctors ?? []).length}
		<div class="field">
			<span class="field-label">Your doctors</span>
			{#each $requirements.assignedDoctors as a}
				<p class="detail">{a.specialty} · {a.doctorId}</p>
			{/each}
		</div>
	{/if}
	<div class="actions">
		<button class="btn btn-primary" type="submit">{t(lang, 'profile.save')}</button>
		<SkipOnboardingButton role="patient" />
	</div>
	{#if savedNote}<p class="demo-banner">{savedNote}</p>{/if}
</form>

<SystemsPrefs />

<style>
	.demo-kicker {
		margin: 0 0 0.35rem;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #203b73;
	}
	.demo-banner {
		margin: 0.75rem 0 0;
		padding: 0.85rem 1rem;
		border-radius: 12px;
		background: #f5ebdd;
		color: #1c2433;
		max-width: 42rem;
	}
	.field-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.35rem;
	}
	#time-bands label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0.25rem 0;
	}
</style>
