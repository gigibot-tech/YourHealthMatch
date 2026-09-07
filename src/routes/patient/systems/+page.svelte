<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { PATIENT_PROFILE_PATH } from '$lib/application/services';

	onMount(() => {
		goto(`${PATIENT_PROFILE_PATH}#systems`);
	});
</script>

<p class="detail">Booking apps live in your profile…</p>
