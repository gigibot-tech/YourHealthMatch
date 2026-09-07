<script lang="ts">
	import { externalSystemService } from '$lib/application/services';
	import { SUGGEST_OTHER_ID } from '$lib/domain/externalSystems/catalog';

	const catalog = externalSystemService.listCatalog().filter((s) => s.id !== 'yhm_video');
	const existing = externalSystemService.getPrefs();

	let selected = $state<string[]>([...existing.systemIds.filter((id) => id !== SUGGEST_OTHER_ID)]);
	let suggestOpen = $state(
		existing.systemIds.includes(SUGGEST_OTHER_ID) || Boolean(existing.suggestedName)
	);
	let suggestedName = $state(existing.suggestedName);
	let suggestedNote = $state(existing.suggestedNote);
	let notice = $state('');

	function persist() {
		externalSystemService.savePrefs({
			systemIds: suggestOpen ? [...selected, SUGGEST_OTHER_ID] : selected,
			suggestedName: suggestOpen ? suggestedName : '',
			suggestedNote: suggestOpen ? suggestedNote : ''
		});
	}

	function toggle(id: string) {
		if (selected.includes(id)) selected = selected.filter((x) => x !== id);
		else selected = [...selected, id];
		persist();
	}

	async function sendSuggestion() {
		persist();
		if (!suggestedName.trim()) {
			notice = 'Add a system name to send a suggestion.';
			return;
		}
		try {
			const { mailto } = await externalSystemService.suggestOther({
				name: suggestedName,
				note: suggestedNote,
				role: 'patient'
			});
			window.location.href = mailto;
			notice = 'Opening email to contact@yourhealthmatch.com…';
		} catch (e) {
			notice = e instanceof Error ? e.message : 'Could not submit suggestion';
		}
	}
</script>

<div class="card" id="systems">
	<h2 class="section-title" style="margin-top:0">Systems you already use</h2>
	<p class="sub">
		Doctolib, Doctena, arzt-direkt, CGM — shortcuts on match and dashboard. We do not import those
		calendars.
	</p>
	{#each catalog as s}
		<label class="system-row">
			<input type="checkbox" checked={selected.includes(s.id)} onchange={() => toggle(s.id)} />
			<span>
				<strong>{s.name}</strong>
				<span class="detail"> · {s.kind} — {s.blurb}</span>
			</span>
		</label>
	{/each}

	<label class="system-row">
		<input
			type="checkbox"
			bind:checked={suggestOpen}
			onchange={() => {
				persist();
			}}
		/>
		<span>
			<strong>Other — suggest a system</strong>
			<span class="detail"> · notifies us + opens email to contact@yourhealthmatch.com</span>
		</span>
	</label>

	{#if suggestOpen}
		<div class="field" style="margin-top:0.75rem">
			<label for="sname">System name</label>
			<input
				id="sname"
				bind:value={suggestedName}
				placeholder="e.g. TeleClinic, Medgate…"
				onchange={persist}
			/>
		</div>
		<div class="field">
			<label for="snote">Where / specialty (optional)</label>
			<textarea
				id="snote"
				rows="2"
				bind:value={suggestedNote}
				placeholder="Used in … for …"
				onchange={persist}
			></textarea>
		</div>
		<button class="btn btn-ghost btn-sm" type="button" onclick={sendSuggestion}
			>Send suggestion</button
		>
	{/if}

	{#if notice}<p class="detail">{notice}</p>{/if}
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
