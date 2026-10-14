<script lang="ts">
	import { goto } from '$app/navigation';
	import { joinTestSeekerWaitlist, type WaitlistJoinResult } from '$lib/adapters/testSeekerWaitlist';
	import { startSession, type SessionRole } from '$lib/application/services';
	import SiteFooter from '$lib/components/marketing/SiteFooter.svelte';
	import SiteHeader from '$lib/components/marketing/SiteHeader.svelte';
	import SkipOnboardingButton from '$lib/components/session/SkipOnboardingButton.svelte';
	import { LANDING, type LandingLang } from '$lib/i18n/landing';
	import { preferences } from '$lib/stores/app';

	let email = $state('');
	let who = $state<'test_patient' | 'clinic'>('test_patient');
	let pending = $state(false);
	let result = $state<WaitlistJoinResult | null>(null);
	let lang = $derived<LandingLang>($preferences.language === 'DE' ? 'DE' : 'EN');
	const copy = $derived(LANDING[lang]);

	function start(nextRole: SessionRole) {
		goto(startSession({ role: nextRole, skipOnboarding: false }));
	}

	async function join(event: SubmitEvent) {
		event.preventDefault();
		if (pending) return;
		pending = true;
		result = null;
		try {
			result = await joinTestSeekerWaitlist(email, who);
			if (result === 'joined' || result === 'already') email = '';
		} catch {
			result = 'failed';
		} finally {
			pending = false;
		}
	}
</script>

<div class="landing" id="top" lang={lang === 'DE' ? 'de' : 'en'}>
	<SiteHeader {lang} />

	<section class="hero">
		<div class="hero-copy">
			<p class="kicker">{copy.heroKicker}</p>
			<h1>{copy.heroTitle}</h1>
			<p class="lede">{copy.heroSub}</p>
			<button class="site-cta" type="button" onclick={() => start('patient')}>{copy.heroCta}</button>
		</div>
		<figure class="hero-photo">
			<img src="/images/hero-scene.png" alt="" />
			<ul class="chips">
				{#each copy.chips as chip}
					<li>{chip}</li>
				{/each}
			</ul>
		</figure>
	</section>

	<section id="problem" class="band">
		<div class="problem-row">
			<div>
				<p class="kicker">{copy.problemKicker}</p>
				<h2>{copy.problemTitle}</h2>
				<p class="lede">{copy.problemIntro}</p>
			</div>
			<form id="join" class="hero-form join-form" onsubmit={join}>
				<h2>{copy.finalTitle}</h2>
				<p class="lede">{copy.finalSub}</p>
				<fieldset>
					<legend>{copy.joinLegend}</legend>
					<label>
						<input type="radio" name="who" value="test_patient" bind:group={who} />
						{copy.interest}
					</label>
					<label>
						<input type="radio" name="who" value="clinic" bind:group={who} />
						{copy.clinic}
					</label>
				</fieldset>
				<label for="waitlist-email">{copy.email}</label>
				<input
					id="waitlist-email"
					name="email"
					type="email"
					autocomplete="email"
					inputmode="email"
					required
					placeholder="you@email.com"
					bind:value={email}
				/>
				<button class="site-cta" type="submit" disabled={pending}>
					{pending ? copy.saving : copy.send}
				</button>
				<p class="form-status" aria-live="polite">
					{#if result === 'joined'}{copy.joined}{/if}
					{#if result === 'already'}{copy.already}{/if}
					{#if result === 'invalid'}{copy.invalid}{/if}
					{#if result === 'unavailable'}{copy.unavailable}{/if}
					{#if result === 'failed'}{copy.failed}{/if}
				</p>
			</form>
		</div>
		<div class="cards cards-4">
			{#each copy.problems as item}
				<article>
					<h3>{item.title}</h3>
					<p>{item.body}</p>
				</article>
			{/each}
		</div>
	</section>

	<section id="solution" class="band band-tint">
		<div class="split">
			<div>
				<p class="kicker">{copy.solutionKicker}</p>
				<h2>{copy.solutionTitle}</h2>
				<p class="lede">{copy.solutionIntro}</p>
			</div>
			<div class="match-board" aria-label={copy.visualTitle}>
				{#each copy.solutions as item}
					<p><strong>{item.title}.</strong> {item.body}</p>
				{/each}
				<article class="example-match">
					<p>{copy.exampleLabel}</p>
					<strong>{copy.exampleRole}</strong>
					<span>{copy.exampleMeta}</span>
				</article>
			</div>
		</div>
	</section>

	<section id="how" class="band band-sage">
		<p class="kicker">{copy.howKicker}</p>
		<h2>{copy.howTitle}</h2>
		<ol class="steps steps-row">
			{#each copy.steps as step, i}
				<li>
					<span>{i + 1}</span>
					<div>
						<h3>{step.title}</h3>
						<p>{step.body}</p>
					</div>
				</li>
			{/each}
		</ol>
	</section>

	<section id="benefits" class="band">
		<p class="kicker">{copy.benefitsKicker}</p>
		<h2>{copy.benefitsTitle}</h2>
		<div class="cards cards-4">
			{#each copy.benefits as item}
				<article>
					<h3>{item.title}</h3>
					<p>{item.body}</p>
				</article>
			{/each}
		</div>
	</section>

	<section id="trust" class="band band-tint">
		<p class="kicker">{copy.trustKicker}</p>
		<h2>{copy.trustTitle}</h2>
		<p class="lede">{copy.trustIntro}</p>
		<div class="cards cards-3">
			{#each copy.trust as item}
				<article>
					<h3>{item.title}</h3>
					<p>{item.body}</p>
				</article>
			{/each}
		</div>
	</section>

	<section id="demo" class="band band-sage">
		<p class="kicker">{copy.demoKicker}</p>
		<h2>{copy.demoTitle}</h2>
		<p class="lede">{copy.demoIntro}</p>
		<div class="demo-grid">
			<article class="demo-card">
				<h3>{copy.patientTitle}</h3>
				<p>{copy.patientBody}</p>
				<div class="demo-actions">
					<button class="site-cta" type="button" onclick={() => start('patient')}>{copy.patientCta}</button>
					<SkipOnboardingButton role="patient" compact label={copy.skip} />
				</div>
			</article>
			<article class="demo-card">
				<h3>{copy.clinicTitle}</h3>
				<p>{copy.clinicBody}</p>
				<div class="demo-actions">
					<button class="site-cta" type="button" onclick={() => start('doctor')}>{copy.clinicCta}</button>
					<SkipOnboardingButton role="doctor" compact label={copy.skip} />
				</div>
			</article>
		</div>
	</section>

	<SiteFooter {lang} />
</div>
