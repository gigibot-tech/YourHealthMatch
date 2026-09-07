<script lang="ts">
	import { goto } from '$app/navigation';
	import { canSkipOnboarding, startSession, type SessionRole } from '$lib/application/services';
	import { availability, practices } from '$lib/stores/app';

	let {
		role,
		label = 'Skip onboarding',
		compact = false
	}: {
		role: SessionRole;
		label?: string;
		compact?: boolean;
	} = $props();

	let allowed = $derived.by(() => {
		void $availability;
		void $practices;
		return canSkipOnboarding(role);
	});

	function skip() {
		if (!allowed) return;
		goto(startSession({ role, skipOnboarding: true }));
	}
</script>

<button
	class="btn btn-ghost"
	class:btn-sm={compact}
	type="button"
	disabled={!allowed}
	title={allowed ? undefined : 'Demo clinic isn’t available yet'}
	onclick={skip}
>
	{label}
</button>
