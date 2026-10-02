<script lang="ts">
	import {
		registrationLanguageOptions,
		normalizeLanguageCode
	} from '$lib/domain/languages';

	let {
		id = 'lang',
		value = $bindable(''),
		required = false,
		label = 'Preferred language',
		compact = false
	}: {
		id?: string;
		value?: string;
		required?: boolean;
		label?: string;
		compact?: boolean;
	} = $props();

	const options = registrationLanguageOptions();

	function onChange(e: Event) {
		value = (e.currentTarget as HTMLSelectElement).value;
	}
</script>

{#if compact}
	<select
		{id}
		class="lang-select"
		aria-label={label}
		value={normalizeLanguageCode(value) || ''}
		onchange={onChange}
	>
		{#each options as opt}
			<option value={opt.code}>{opt.label}</option>
		{/each}
	</select>
{:else}
	<div class="field">
		<label for={id}>{label}</label>
		<select {id} {required} value={value} onchange={onChange}>
			<option value="">Select…</option>
			{#each options as opt}
				<option value={opt.code}>{opt.label}</option>
			{/each}
		</select>
	</div>
{/if}
