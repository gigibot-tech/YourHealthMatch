<script lang="ts">
	import { LANDING, type LandingLang } from '$lib/i18n/landing';

	type CircleId = 'people' | 'access' | 'providers';

	let { lang }: { lang: LandingLang } = $props();
	const copy = $derived(LANDING[lang]);
	let selected = $state<CircleId | null>('people');
	let hovered = $state<CircleId | null>(null);

	/** Equilateral Venn — closer centers so all three lobes share a clear middle. */
	const d = 118;
	const cx = 200;
	const cy = 172;
	const half = d / 2;
	const topY = cy - d / (2 * Math.sqrt(3));
	const bottomY = cy + d / Math.sqrt(3);

	const circles = {
		people: { cx: cx - half, cy: topY, labelX: cx - half - 48, labelY: topY - 28 },
		access: { cx: cx + half, cy: topY, labelX: cx + half + 48, labelY: topY - 28 },
		providers: { cx, cy: bottomY, labelX: cx, labelY: bottomY + 42 }
	} as const;

	const r = 112;

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
			<svg class="about-circles-svg" viewBox="0 0 400 360" aria-hidden="true">
				<g class="about-circles-blend">
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
				</g>

				<rect
					class="about-circles-center-bg"
					x={lang === 'DE' ? 114 : 128}
					y={cy - 16}
					width={lang === 'DE' ? 172 : 144}
					height="36"
					rx="18"
				/>
				<text class="about-circles-center" x={cx} y={cy + 6} text-anchor="middle">
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
					style={`left:${(pos.cx / 400) * 100}%;top:${(pos.cy / 360) * 100}%;width:${((r * 2) / 400) * 100}%;`}
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
