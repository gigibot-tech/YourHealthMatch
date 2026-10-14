<script lang="ts">
	import { LANDING, type LandingLang } from '$lib/i18n/landing';

	let { lang }: { lang: LandingLang } = $props();
	const copy = $derived(LANDING[lang]);
	let focused = $state<string>('c');

	const tip = $derived(copy.aboutMapProviders.find((p) => p.id === focused) ?? null);
</script>

<section class="about-map" aria-labelledby="about-map-title">
	<div class="about-section-copy">
		<p class="kicker">{copy.aboutMapKicker}</p>
		<h2 id="about-map-title">{copy.aboutMapTitle}</h2>
		<p class="lede">{copy.aboutMapLead}</p>
	</div>

	<div class="about-map-frame">
		<div class="about-map-stage">
			<svg class="about-map-svg" viewBox="0 0 520 320" aria-hidden="true">
				<defs>
					<linearGradient id="about-map-wash" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stop-color="#e8f2f0" />
						<stop offset="55%" stop-color="#f7f1e8" />
						<stop offset="100%" stop-color="#e7eef8" />
					</linearGradient>
				</defs>

				<rect class="about-map-ground" x="0" y="0" width="520" height="320" rx="18" />

				<rect class="about-map-block" x="40" y="40" width="70" height="48" rx="4" />
				<rect class="about-map-block" x="130" y="55" width="90" height="36" rx="4" />
				<rect class="about-map-block" x="300" y="36" width="60" height="54" rx="4" />
				<rect class="about-map-block" x="390" y="140" width="80" height="44" rx="4" />
				<rect class="about-map-block" x="60" y="180" width="55" height="70" rx="4" />
				<rect class="about-map-block" x="250" y="210" width="100" height="50" rx="4" />

				<path
					class="about-map-street"
					d="M20 250 H500 M20 120 H500 M120 20 V300 M280 20 V300 M400 20 V300 M20 70 H500"
				/>
				<path
					class="about-map-street about-map-street-soft"
					d="M20 180 H500 M200 20 V300 M340 20 V300"
				/>

				<path
					class="about-map-route"
					d="M72 250 C120 250, 160 200, 210 120 S320 90, 430 95"
					fill="none"
				/>

				<g class="about-map-you-mark" transform="translate(72 250)">
					<circle class="about-map-you-ring" r="16" />
					<circle class="about-map-you-dot" r="7" />
				</g>
			</svg>

			<span class="about-map-you-label">{copy.aboutMapYou}</span>

			{#each copy.aboutMapProviders as provider}
				<button
					type="button"
					class="about-map-pin-btn about-map-pin-{provider.id}"
					class:is-match={provider.id === 'c'}
					class:is-open={focused === provider.id}
					aria-pressed={focused === provider.id}
					aria-label={provider.name}
					onmouseenter={() => (focused = provider.id)}
					onfocus={() => (focused = provider.id)}
					onclick={() => (focused = provider.id)}
				>
					<svg class="about-map-pin-shape" viewBox="0 0 28 36" aria-hidden="true">
						<path
							d="M14 2 C21 2 26 8 26 15 C26 24 14 34 14 34 C14 34 2 24 2 15 C2 8 7 2 14 2 Z"
						/>
						<circle cx="14" cy="14" r="4.5" />
					</svg>
					{#if provider.id === 'c'}
						<span class="about-map-match-label">{copy.aboutMapMatch}</span>
					{/if}
				</button>
			{/each}
		</div>

		<aside class="about-map-tip" aria-live="polite">
			{#if tip}
				<p class="about-map-tip-name">{tip.name}</p>
				<p>{tip.language}</p>
				<p>{tip.area}</p>
				<p>{tip.insurance}</p>
			{/if}
		</aside>
	</div>

	<p class="about-map-caption">{copy.aboutMapCaption}</p>
</section>
