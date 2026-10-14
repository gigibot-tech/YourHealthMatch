<script lang="ts">
	import { LANDING, type LandingLang } from '$lib/i18n/landing';

	let { lang }: { lang: LandingLang } = $props();
	const copy = $derived(LANDING[lang]);
</script>

<footer class="site-footer">
	<div class="site-footer-inner">
		<div>
			<strong>YourHealthMatch</strong>
			<p>{copy.footerNote}</p>
		</div>
		<nav aria-label="Footer">
			<a href="/about">{copy.footerAbout}</a>
			<a href="/#join">{copy.footerContact}</a>
			<a href="/privacy">{copy.footerPrivacy}</a>
			<a href="/legal">{copy.footerLegal}</a>
			<a href="mailto:contact@yourhealthmatch.com">contact@yourhealthmatch.com</a>
		</nav>
	</div>
</footer>
