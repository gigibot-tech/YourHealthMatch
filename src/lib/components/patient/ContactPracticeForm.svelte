<script lang="ts">
	import { interestService } from '$lib/application/services';
	import { preferences, requirements } from '$lib/stores/app';
	import { fill, t, uiLanguage } from '$lib/i18n';

	let {
		practiceId,
		doctorId = '',
		compact = false
	}: {
		practiceId: string;
		doctorId?: string;
		compact?: boolean;
	} = $props();

	let lang = $derived(uiLanguage($preferences.language));
	let email = $state('');
	let note = $state('');
	let notice = $state('');
	let sending = $state(false);

	async function send(e: Event) {
		e.preventDefault();
		sending = true;
		notice = '';
		try {
			const { mailto } = await interestService.requestContact({
				email,
				practiceId,
				doctorId: doctorId || undefined,
				note,
				requirements: $requirements
			});
			window.location.href = mailto;
			notice = fill(lang, 'visit.opening', { email: interestService.contactEmail });
			note = '';
		} catch (err) {
			notice = err instanceof Error ? err.message : 'Could not send the request';
		} finally {
			sending = false;
		}
	}
</script>

<details class="contact-practice" class:compact>
	<summary class="btn btn-ghost" class:btn-sm={compact}>{t(lang, 'visit.contact')}</summary>
	<form class="contact-form" onsubmit={send}>
		<p class="detail">{fill(lang, 'visit.contactHint', { email: interestService.contactEmail })}</p>
		<div class="field">
			<label for={`contact-email-${practiceId}`}>{t(lang, 'visit.email')}</label>
			<input
				id={`contact-email-${practiceId}`}
				type="email"
				bind:value={email}
				placeholder="you@email.com"
				required
			/>
		</div>
		<div class="field">
			<label for={`contact-note-${practiceId}`}>{t(lang, 'visit.note')}</label>
			<textarea
				id={`contact-note-${practiceId}`}
				rows="2"
				bind:value={note}
				placeholder="Language, insurance, preferred time…"
			></textarea>
		</div>
		<div class="actions">
			<button class="btn btn-primary" class:btn-sm={compact} type="submit" disabled={sending}
				>{t(lang, 'visit.send')}</button
			>
		</div>
		{#if notice}<p class="detail">{notice}</p>{/if}
	</form>
</details>

<style>
	.contact-practice {
		margin-top: 0.5rem;
	}
	.contact-practice > summary {
		list-style: none;
		display: inline-block;
		cursor: pointer;
	}
	.contact-practice > summary::-webkit-details-marker {
		display: none;
	}
	.contact-form {
		margin-top: 0.65rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border);
	}
	.compact {
		margin-top: 0.35rem;
	}
</style>
