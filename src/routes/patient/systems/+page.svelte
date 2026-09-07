<script lang="ts">
	import { goto } from '$app/navigation';
	import { externalSystemService } from '$lib/application/externalSystemService';
	import { SUGGEST_OTHER_ID } from '$lib/domain/externalSystems/catalog';

	const catalog = externalSystemService.listCatalog().filter((s) => s.id !== 'yhm_video');
	const existing = externalSystemService.getPrefs();

	let selected = $state<string[]>([...existing.systemIds.filter((id) => id !== SUGGEST_OTHER_ID)]);
	let suggestOpen = $state(existing.systemIds.includes(SUGGEST_OTHER_ID) || Boolean(existing.suggestedName));
	let suggestedName = $state(existing.suggestedName);
	let suggestedNote = $state(existing.suggestedNote);
	let notice = $state('');

	function toggle(id: string) {
		if (selected.includes(id)) selected = selected.filter((x) => x !== id);
		else selected = [...selected, id];
	}

	async function continueNext() {
		externalSystemService.savePrefs({
			systemIds: suggestOpen ? [...selected, SUGGEST_OTHER_ID] : selected,
			suggestedName: suggestOpen ? suggestedName : '',
			suggestedNote: suggestOpen ? suggestedNote : ''
		});

		if (suggestOpen && suggestedName.trim()) {
			try {
				const { mailto } = await externalSystemService.suggestOther({
					name: suggestedName,
					note: suggestedNote,
					role: 'patient'
				});
				// Launch mail client so they can send to contact@yourhealthmatch.com
				window.location.href = mailto;
				notice = 'Opening email to contact@yourhealthmatch.com…';
			} catch (e) {
				notice = e instanceof Error ? e.message : 'Could not submit suggestion';
				return;
			}
		}

		goto('/patient/requirements');
	}

	function skip() {
		goto('/patient/requirements');
	}
</script>

<div class="page-header">
	<h1>Systems you already use</h1>
	<p class="sub">
		Doctolib, Doctena, arzt-direkt, CGM / e-health portals, and more — we’ll show shortcuts later and
		can open them for you.
	</p>
</div>

<div class="card">
	{#each catalog as s}
		<label class="system-row">
			<input
				type="checkbox"
				checked={selected.includes(s.id)}
				onchange={() => toggle(s.id)}
			/>
			<span>
				<strong>{s.name}</strong>
				<span class="detail"> · {s.kind} — {s.blurb}</span>
			</span>
		</label>
	{/each}

	<label class="system-row">
		<input type="checkbox" bind:checked={suggestOpen} />
		<span>
			<strong>Other — suggest a system</strong>
			<span class="detail"> · notifies us + opens email to contact@yourhealthmatch.com</span>
		</span>
	</label>

	{#if suggestOpen}
		<div class="field" style="margin-top:0.75rem">
			<label for="sname">System name</label>
			<input id="sname" bind:value={suggestedName} placeholder="e.g. TeleClinic, Medgate…" />
		</div>
		<div class="field">
			<label for="snote">Where / specialty (optional)</label>
			<textarea id="snote" rows="2" bind:value={suggestedNote} placeholder="Used in … for …"></textarea>
		</div>
	{/if}

	{#if notice}<p class="detail">{notice}</p>{/if}

	<div class="actions">
		<button class="btn btn-primary" type="button" onclick={continueNext}>Continue</button>
		<button class="btn btn-ghost" type="button" onclick={skip}>Skip for now</button>
	</div>
</div>

<style>
	.system-row {
		display: flex;
		gap: 0.65rem;
		align-items: flex-start;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--border);
		cursor: pointer;
	}
	.system-row input {
		margin-top: 0.25rem;
	}
</style>
