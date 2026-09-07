<script lang="ts">
	import { goto } from '$app/navigation';
	import { requirements, patchRequirements } from '$lib/stores/app';
	import { matchingService, startSession } from '$lib/application/services';
	import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';

	let form = $state({ ...$requirements });

	function save(e: Event) {
		e.preventDefault();
		const saved = patchRequirements(form as Partial<PatientRequirements>);
		const missing = matchingService.isPatientReady(saved);
		if (missing.length) {
			alert(`Still needed: ${missing.join(', ')}`);
			return;
		}
		goto('/patient/match');
	}

	function skipWithLocalData() {
		goto(startSession({ role: 'patient', skipOnboarding: true }));
	}
</script>

<div class="page-header">
	<h1>Your requirements</h1>
	<p class="sub">Everything matching needs — no match-critical fields later in the flow.</p>
</div>

<form class="card" onsubmit={save}>
	<div class="field-row">
		<div class="field">
			<label for="language">Language</label>
			<input id="language" bind:value={form.language} required />
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
		<button class="btn btn-ghost" type="button" onclick={skipWithLocalData}
			>Skip — use local data</button
		>
	</div>
</form>
