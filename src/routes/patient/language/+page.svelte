<script lang="ts">
	import { goto } from '$app/navigation';
	import { preferences, patchRequirements } from '$lib/stores/app';

	let language = $state($preferences.language || 'Arabic');

	function continueNext() {
		preferences.set({ language });
		patchRequirements({ language });
		goto('/patient/systems');
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
			<option>Arabic</option>
			<option>English</option>
			<option>German</option>
			<option>Turkish</option>
			<option>Ukrainian</option>
			<option>Russian</option>
		</select>
	</div>
	<button class="btn btn-primary" type="button" onclick={continueNext}>Continue</button>
</div>
