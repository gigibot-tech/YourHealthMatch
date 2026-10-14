<script lang="ts">
	import SiteFooter from '$lib/components/marketing/SiteFooter.svelte';
	import SiteHeader from '$lib/components/marketing/SiteHeader.svelte';
	import { LANDING, type LandingLang } from '$lib/i18n/landing';
	import { preferences } from '$lib/stores/app';

	let lang = $derived<LandingLang>($preferences.language === 'DE' ? 'DE' : 'EN');
	const copy = $derived(LANDING[lang]);
</script>

<div class="landing" lang={lang === 'DE' ? 'de' : 'en'}>
	<SiteHeader {lang} />
	<main class="band prose">
		<p class="kicker">YourHealthMatch</p>
		<h1>{copy.legalTitle}</h1>
		<p class="lede">{copy.legalLead}</p>
		<ul>
			{#each copy.legalPoints as point}
				<li>{point}</li>
			{/each}
		</ul>
		<p><a class="text-link" href="/">{copy.backHome}</a></p>
	</main>
	<SiteFooter {lang} />
</div>
