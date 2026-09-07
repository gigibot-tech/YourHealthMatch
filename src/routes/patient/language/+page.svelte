<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { PATIENT_PROFILE_PATH } from '$lib/application/services';

	onMount(() => {
		goto(`${PATIENT_PROFILE_PATH}#language`);
	});
</script>

<p class="detail">Language lives in your profile…</p>
