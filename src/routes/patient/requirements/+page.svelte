<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { preferences, requirements, patchRequirements } from '$lib/stores/app';
	import { matchingService } from '$lib/application/services';
	import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
	import { normalizeLanguageCode } from '$lib/domain/languages';
	import LanguageSelect from '$lib/components/i18n/LanguageSelect.svelte';
	import SkipOnboardingButton from '$lib/components/session/SkipOnboardingButton.svelte';
	import SystemsPrefs from '$lib/components/patient/SystemsPrefs.svelte';

	let form = $state({
		...$requirements,
		language: normalizeLanguageCode($requirements.language) || $requirements.language
	});

	onMount(() => {
		const id = window.location.hash.replace('#', '');
		if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	});

	function save(e: Event) {
		e.preventDefault();
		const language = normalizeLanguageCode(form.language) || form.language;
		if (language) preferences.set({ language });
		const saved = patchRequirements({ ...form, language } as Partial<PatientRequirements>);
		const missing = matchingService.isPatientReady(saved);
		if (missing.length) {
			alert(`Still needed: ${missing.join(', ')}`);
			return;
		}
		goto('/patient/match');
	}
</script>

<div class="page-header">
	<h1>Profile</h1>
	<p class="sub">
		Multilingual registration (UK / AR / TR / RU / EN / DE), match requirements, and booking apps.
	</p>
</div>

<form class="card" id="requirements" onsubmit={save}>
	<h2 class="section-title" style="margin-top:0">Match requirements</h2>
	<p class="sub">Matching will not run until these are filled.</p>
	<div class="field-row">
		<div id="language">
			<LanguageSelect id="lang" bind:value={form.language} required label="Preferred language" />
		</div>
		<div class="field">
			<label for="specialty">Specialty</label>
			<select id="specialty" bind:value={form.specialty} required>
				<option value="">Select…</option>
				<option>General Practitioner</option>
				<option>Dermatology</option>
				<option>Dentist</option>
				<option>Ophthalmology</option>
				<option>Cardiologist</option>
			</select>
		</div>
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
	<div class="actions">
		<button class="btn btn-primary" type="submit">Find matches</button>
		<SkipOnboardingButton role="patient" />
	</div>
</form>

<SystemsPrefs />
