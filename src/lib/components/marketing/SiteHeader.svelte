<script lang="ts">
	import { LANDING, type LandingLang } from '$lib/i18n/landing';
	import { preferences } from '$lib/stores/app';

	let { lang }: { lang: LandingLang } = $props();
	const copy = $derived(LANDING[lang]);

	function setLang(next: LandingLang) {
		preferences.set({ language: next });
	}
</script>

<header class="site-header">
	<a class="site-brand" href="/#top">
		<span class="site-mark" aria-hidden="true"></span>
		YourHealthMatch
	</a>
	<nav class="site-nav" aria-label="Page">
		<a href="/#how">{copy.navHow}</a>
		<a href="/#clinics">{copy.navClinics}</a>
		<a href="/about">{copy.navAbout}</a>
		<div class="site-lang" role="group" aria-label={copy.langLabel}>
			<button type="button" class:on={lang === 'DE'} onclick={() => setLang('DE')}>Deutsch</button>
			<button type="button" class:on={lang === 'EN'} onclick={() => setLang('EN')}>English</button>
		</div>
	</nav>
</header>
