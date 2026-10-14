<script lang="ts">
	import MatchCircles from '$lib/components/marketing/MatchCircles.svelte';
	import MatchJourney from '$lib/components/marketing/MatchJourney.svelte';
	import SiteFooter from '$lib/components/marketing/SiteFooter.svelte';
	import SiteHeader from '$lib/components/marketing/SiteHeader.svelte';
	import { LANDING, type LandingLang } from '$lib/i18n/landing';
	import { preferences } from '$lib/stores/app';

	let lang = $derived<LandingLang>($preferences.language === 'DE' ? 'DE' : 'EN');
	const copy = $derived(LANDING[lang]);
</script>

<div class="landing" lang={lang === 'DE' ? 'de' : 'en'}>
	<SiteHeader {lang} />
	<main>
		<section class="band prose about-intro">
			<p class="kicker">YourHealthMatch</p>
			<h1>{copy.aboutTitle}</h1>
			<p class="lede">{copy.aboutLead}</p>
			<p>{copy.aboutBody}</p>
		</section>

		<section class="band band-cream about-visual-band">
			<MatchCircles {lang} />
		</section>

		<section class="band about-visual-band">
			<MatchJourney {lang} />
		</section>

		<section class="band prose">
			<p><a class="text-link" href="/">{copy.backHome}</a></p>
		</section>
	</main>
	<SiteFooter {lang} />
</div>
