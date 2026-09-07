<script lang="ts">
	import type { FactCard } from '$lib/domain/facts/factCards';

	let {
		cards,
		heading = 'While you wait',
		compact = false
	}: {
		cards: FactCard[];
		heading?: string;
		compact?: boolean;
	} = $props();

	let index = $state(0);
	let paused = $state(false);
	let reduceMotion = $state(false);

	let ids = $derived(cards.map((c) => c.id).join('|'));

	$effect(() => {
		ids;
		index = 0;
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (reduceMotion = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	$effect(() => {
		if (cards.length < 2 || paused || reduceMotion) return;
		const id = window.setInterval(() => {
			index = (index + 1) % cards.length;
		}, 8000);
		return () => window.clearInterval(id);
	});

	let current = $derived(cards[index] ?? cards[0]);

	function prev() {
		if (!cards.length) return;
		index = (index - 1 + cards.length) % cards.length;
	}

	function next() {
		if (!cards.length) return;
		index = (index + 1) % cards.length;
	}

	function onNavKey(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			prev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			next();
		}
	}

	function isInternal(href: string) {
		return href.startsWith('/');
	}
</script>

{#if cards.length && current}
	<div
		class="facts-carousel card"
		class:compact
		role="region"
		aria-roledescription="carousel"
		aria-label={heading}
		onmouseenter={() => (paused = true)}
		onmouseleave={() => (paused = false)}
		onfocusin={() => (paused = true)}
		onfocusout={() => (paused = false)}
	>
		<div class="facts-carousel-head">
			<h2 class="section-title">{heading}</h2>
			{#if cards.length > 1}
				<div class="facts-carousel-nav" role="group" aria-label="Fact carousel controls" onkeydown={onNavKey}>
					<button type="button" class="btn btn-ghost btn-sm" onclick={prev} aria-label="Previous fact"
						>‹</button
					>
					<span class="facts-carousel-count" aria-live="polite">{index + 1} / {cards.length}</span>
					<button type="button" class="btn btn-ghost btn-sm" onclick={next} aria-label="Next fact"
						>›</button
					>
				</div>
			{/if}
		</div>

		<article class="facts-slide">
			<h3>{current.title}</h3>
			<p>{current.body}</p>
			{#if current.source}
				<p class="facts-source">
					Source: <a href={current.source.url} target="_blank" rel="noopener noreferrer"
						>{current.source.label}</a
					>
					({current.source.year}){#if current.source.note}
						<span> — {current.source.note}</span>
					{/if}
				</p>
			{/if}
			{#if current.href}
				{#if isInternal(current.href)}
					<a class="btn btn-primary btn-sm" href={current.href}>{current.hrefLabel || 'Open'}</a>
				{:else}
					<a
						class="btn btn-primary btn-sm"
						href={current.href}
						target="_blank"
						rel="noopener noreferrer">{current.hrefLabel || 'Open'}</a
					>
				{/if}
			{/if}
		</article>

		{#if cards.length > 1}
			<div class="facts-dots" role="tablist" aria-label="Fact slides">
				{#each cards as card, i}
					<button
						type="button"
						class="facts-dot"
						class:active={i === index}
						role="tab"
						aria-selected={i === index}
						aria-label={`Show fact ${i + 1}: ${card.title}`}
						onclick={() => (index = i)}
					></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
