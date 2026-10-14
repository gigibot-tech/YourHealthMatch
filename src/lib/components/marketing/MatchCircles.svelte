<script lang="ts">
	import { LANDING, type LandingLang } from '$lib/i18n/landing';

	type CircleId = 'people' | 'access' | 'providers';

	let { lang }: { lang: LandingLang } = $props();
	const copy = $derived(LANDING[lang]);
	let selected = $state<CircleId | null>('people');
	let hovered = $state<CircleId | null>(null);

	const circles = {
		people: { cx: 150, cy: 138, labelX: 108, labelY: 108 },
		access: { cx: 250, cy: 138, labelX: 292, labelY: 108 },
		providers: { cx: 200, cy: 224, labelX: 200, labelY: 262 }
	} as const;

	const r = 96;

	function toggle(id: CircleId) {
		selected = selected === id ? null : id;
	}

	const active = $derived(copy.aboutCircles.find((c) => c.id === selected) ?? null);
</script>

<section class="about-circles" aria-labelledby="about-circles-title">
	<div class="about-section-copy">
		<p class="kicker">{copy.aboutCirclesKicker}</p>
		<h2 id="about-circles-title">{copy.aboutCirclesTitle}</h2>
		<p class="lede">{copy.aboutCirclesLead}</p>
	</div>

	<div class="about-circles-layout">
		<div class="about-circles-stage" role="group" aria-label={copy.aboutCirclesTitle}>
			<svg class="about-circles-svg" viewBox="0 0 400 340" aria-hidden="true">
				{#each copy.aboutCircles as circle}
					{@const pos = circles[circle.id]}
					{@const lit = selected === circle.id || hovered === circle.id}
					<circle
						class="about-circle-disc about-circle-disc-{circle.id}"
						class:is-lit={lit}
						cx={pos.cx}
						cy={pos.cy}
						r={r}
					/>
				{/each}

				<rect
					class="about-circles-center-bg"
					x={lang === 'DE' ? 118 : 132}
					y="166"
					width={lang === 'DE' ? 164 : 136}
					height="38"
					rx="19"
				/>
				<text class="about-circles-center" x="200" y="190" text-anchor="middle">
					{copy.aboutMatchLabel}
				</text>

				{#each copy.aboutCircles as circle}
					{@const pos = circles[circle.id]}
					<text class="about-circle-label" x={pos.labelX} y={pos.labelY} text-anchor="middle">
						{circle.label}
					</text>
				{/each}
			</svg>

			{#each copy.aboutCircles as circle}
				{@const pos = circles[circle.id]}
				<button
					type="button"
					class="about-circle-hit"
					class:is-active={selected === circle.id}
					style={`left:${(pos.cx / 400) * 100}%;top:${(pos.cy / 340) * 100}%;width:${((r * 2) / 400) * 100}%;`}
					aria-pressed={selected === circle.id}
					aria-label={circle.label}
					onmouseenter={() => (hovered = circle.id)}
					onmouseleave={() => (hovered = null)}
					onfocus={() => (hovered = circle.id)}
					onblur={() => (hovered = null)}
					onclick={() => toggle(circle.id)}
				></button>
			{/each}
		</div>

		<aside class="about-circles-panel" aria-live="polite">
			{#if active}
				<p class="about-circles-panel-kicker">{active.label}</p>
				<p>{active.detail}</p>
			{:else}
				<p class="about-circles-hint">{copy.aboutCirclesHint}</p>
			{/if}
		</aside>
	</div>
</section>
