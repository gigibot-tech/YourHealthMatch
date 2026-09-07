<script lang="ts">
	import { goto } from '$app/navigation';
	import { preferences, patchRequirements } from '$lib/stores/app';
	import { startSession } from '$lib/application/services';

	let language = $state($preferences.language || '');

	function continueNext() {
		if (!language) return;
		preferences.set({ language });
		patchRequirements({ language });
		goto('/patient/systems');
	}

	function skipWithLocalData() {
		goto(startSession({ role: 'patient', skipOnboarding: true }));
	}
</script>

<div class="page-header">
	<h1>Preferred language</h1>
	<p class="sub">Used as the default for matching (survey top demand: multilingual search).</p>
</div>

<div class="card">
	<div class="field">
		<label for="lang">Language</label>
		<select id="lang" bind:value={language}>
			<option value="">Select…</option>
			<option>English</option>
			<option>Deutsch</option>
			<option>Arabic</option>
			<option>German</option>
			<option>Turkish</option>
			<option>Ukrainian</option>
			<option>Russian</option>
		</select>
	</div>
	<div class="actions">
		<button class="btn btn-primary" type="button" disabled={!language} onclick={continueNext}
			>Continue</button
		>
		<button class="btn btn-ghost" type="button" onclick={skipWithLocalData}
			>Skip — use local data</button
		>
	</div>
</div>
