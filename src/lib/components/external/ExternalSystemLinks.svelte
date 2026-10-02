<script lang="ts">
	import { externalSystemService } from '$lib/application/externalSystemService';
	import type { AppLaunch } from '$lib/domain/externalSystems/catalog';
	import { preferences } from '$lib/stores/app';
	import { fill, uiLanguage } from '$lib/i18n';

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
		/** This visit: only the practice’s saved booking link (Doctolib, etc.) */
		practiceOnly = false,
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
		practiceOnly?: boolean;
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
		return externalSystemService
			.launchesFor({
				practiceId: practiceId || undefined,
				doctorId: doctorId || undefined,
				doctorName: doctorName || undefined,
				specialty,
				location,
				includeContext
			})
			.filter((l) => !practiceOnly || l.reason === 'practice_channel');
	});

	let lang = $derived(uiLanguage($preferences.language));

	function labelFor(l: AppLaunch) {
		if (l.reason === 'practice_channel' && doctorName) {
			return fill(lang, 'launch.openDoctor', { doctor: doctorName, system: l.name });
		}
		return fill(lang, 'launch.open', { system: l.name });
	}

	function open(l: AppLaunch) {
		externalSystemService.launch(l.href);
	}
</script>

{#if launches.length}
	{#if compact}
		<div class="actions">
			{#each launches as l}
				<button
					class="btn btn-sm"
					class:btn-primary={l.reason === 'practice_channel'}
					class:btn-ghost={l.reason !== 'practice_channel'}
					type="button"
					onclick={() => open(l)}
					title="{l.name} ({l.reason})"
				>
					{labelFor(l)}
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
						{labelFor(l)}
					</button>
				{/each}
			</div>
		</div>
	{/if}
{/if}
