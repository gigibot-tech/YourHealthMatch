<script lang="ts">
	import { externalSystemService } from '$lib/application/externalSystemService';
	import type { AppLaunch } from '$lib/domain/externalSystems/catalog';

	let {
		practiceId = '',
		doctorId = '',
		doctorName = '',
		specialty = '',
		location = '',
		/** Match page: also show specialty/location suggestions */
		includeContext = false,
		/** Dashboard: only patient-saved (no context spam) */
		onlySaved = false,
		title = 'Open in another app',
		compact = false
	}: {
		practiceId?: string;
		doctorId?: string;
		doctorName?: string;
		specialty?: string;
		location?: string;
		includeContext?: boolean;
		onlySaved?: boolean;
		title?: string;
		compact?: boolean;
	} = $props();

	let launches = $derived.by((): AppLaunch[] => {
		if (onlySaved) {
			return externalSystemService.savedSystems().map((s) => ({
				id: s.id,
				name: s.name,
				href: s.url,
				reason: 'patient_pref' as const,
				label: `Open ${s.name}`
			}));
		}
		return externalSystemService.launchesFor({
			practiceId: practiceId || undefined,
			doctorId: doctorId || undefined,
			doctorName: doctorName || undefined,
			specialty,
			location,
			includeContext
		});
	});

	function open(l: AppLaunch) {
		externalSystemService.launch(l.href);
	}
</script>

{#if launches.length}
	{#if compact}
		<div class="actions">
			{#each launches as l}
				<button
					class="btn btn-ghost btn-sm"
					type="button"
					onclick={() => open(l)}
					title="{l.name} ({l.reason})"
				>
					{l.label}
				</button>
			{/each}
		</div>
	{:else}
		<div class="card">
			<h3>{title}</h3>
			<p class="detail">
				Launches when you or the practice selected a system (Doctolib, arzt-direkt, CGM…).
			</p>
			<div class="actions">
				{#each launches as l}
					<button
						class="btn btn-sm"
						class:btn-primary={l.reason === 'practice_channel'}
						class:btn-ghost={l.reason !== 'practice_channel'}
						type="button"
						onclick={() => open(l)}
						title="{l.name} · {l.reason}"
					>
						{l.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}
{/if}
