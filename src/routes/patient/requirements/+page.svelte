<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { preferences, requirements, patchRequirements } from '$lib/stores/app';
	import { matchingService } from '$lib/application/services';
	import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
	import SkipOnboardingButton from '$lib/components/session/SkipOnboardingButton.svelte';
	import SystemsPrefs from '$lib/components/patient/SystemsPrefs.svelte';

	const LANGUAGES = [
		'English',
		'Deutsch',
		'Arabic',
		'German',
		'Turkish',
		'Ukrainian',
		'Russian'
	];

	let form = $state({ ...$requirements });

	onMount(() => {
		const id = window.location.hash.replace('#', '');
		if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	});

	function save(e: Event) {
		e.preventDefault();
		if (form.language) preferences.set({ language: form.language });
		const saved = patchRequirements(form as Partial<PatientRequirements>);
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
	<p class="sub">Language, match requirements, and the booking apps you already use.</p>
</div>

<form class="card" id="requirements" onsubmit={save}>
	<h2 class="section-title" style="margin-top:0">Match requirements</h2>
	<p class="sub">Matching will not run until these are filled.</p>
	<div class="field-row">
		<div class="field" id="language">
			<label for="lang">Preferred language</label>
			<select id="lang" bind:value={form.language} required>
				<option value="">Select…</option>
				{#each LANGUAGES as lang}
					<option>{lang}</option>
				{/each}
			</select>
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
				<option value="private">Private</option>
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
