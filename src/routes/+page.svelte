<script lang="ts">
	import { goto } from '$app/navigation';
	import { joinTestSeekerWaitlist, type WaitlistJoinResult } from '$lib/adapters/testSeekerWaitlist';
	import { startSession, type SessionRole } from '$lib/application/services';
	import { LANDING, type LandingLang } from '$lib/i18n/landing';
	import SkipOnboardingButton from '$lib/components/session/SkipOnboardingButton.svelte';
	import { preferences } from '$lib/stores/app';

	let email = $state('');
	let who = $state<'test_patient' | 'clinic'>('test_patient');
	let pending = $state(false);
	let result = $state<WaitlistJoinResult | null>(null);
	let lang = $state<LandingLang>($preferences.language === 'DE' ? 'DE' : 'EN');

	const copy = $derived(LANDING[lang]);
	const languages = ['Deutsch', 'English', 'Türkçe', 'العربية', 'Українська', 'Русский'];

	function setLang(next: LandingLang) {
		lang = next;
		preferences.set({ language: next });
	}

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
	<nav class="fs-nav" aria-label="Page">
		<a class="fs-brand" href="#top">
			<span class="landing-mark" aria-hidden="true"></span>
			YourHealthMatch
		</a>
		<div class="fs-nav-links">
			<div class="fs-lang" role="group" aria-label={lang === 'DE' ? 'Sprache' : 'Language'}>
				<button type="button" class:on={lang === 'DE'} onclick={() => setLang('DE')}>DE</button>
				<button type="button" class:on={lang === 'EN'} onclick={() => setLang('EN')}>EN</button>
			</div>
			<a href="#demo">{copy.navDemo}</a>
			<a href="#pilot">{copy.navGermany}</a>
			<a class="fs-nav-cta" href="#join">{copy.navCta}</a>
		</div>
	</nav>

	<section class="fs-hero">
		<p class="fs-kicker">{copy.kicker}</p>
		<h1>
			<span>Your</span>
			<span>Health</span>
			<span>Match</span>
		</h1>
		<p class="fs-tag">{copy.tagline}</p>
	</section>

	<section id="pilot" class="fs-band">
		<p class="fs-kicker">{copy.pilotKicker}</p>
		<ul class="fs-langs" aria-label={lang === 'DE' ? 'Sprachen im Piloten' : 'Languages in the trial'}>
			{#each languages as name}
				<li>{name}</li>
			{/each}
		</ul>
		<ul class="fs-points">
			{#each copy.pilotPoints as point}
				<li>{point}</li>
			{/each}
		</ul>
	</section>

	<section id="demo" class="fs-band fs-demo">
		<p class="fs-kicker">{copy.demoKicker}</p>
		<h2>{copy.demoTitle}</h2>
		<ul class="fs-points">
			{#each copy.demoPoints as point}
				<li>{point}</li>
			{/each}
		</ul>
		<div class="fs-paths">
			<article>
				<strong>{copy.patientTitle}</strong>
				<span>{copy.patientBody}</span>
				<div class="actions">
					<button class="fs-outline" type="button" onclick={() => start('patient')}>{copy.patientCta}</button>
					<SkipOnboardingButton role="patient" compact label={copy.skip} />
				</div>
			</article>
			<article>
				<strong>{copy.clinicTitle}</strong>
				<span>{copy.clinicBody}</span>
				<div class="actions">
					<button class="fs-outline" type="button" onclick={() => start('doctor')}>{copy.clinicCta}</button>
					<SkipOnboardingButton role="doctor" compact label={copy.skip} />
				</div>
			</article>
		</div>
	</section>

	<section id="join" class="fs-band fs-join">
		<p class="fs-kicker">{copy.joinKicker}</p>
		<h2>{copy.joinTitle}</h2>
		<form onsubmit={join}>
			<fieldset class="fs-who">
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
				placeholder={copy.email}
				bind:value={email}
			/>
			<button class="fs-outline" type="submit" disabled={pending}>
				{pending ? copy.saving : copy.send}
			</button>
			<p class="fs-status" aria-live="polite">
				{#if result === 'joined'}{copy.joined}{/if}
				{#if result === 'already'}{copy.already}{/if}
				{#if result === 'invalid'}{copy.invalid}{/if}
				{#if result === 'unavailable'}{copy.unavailable}{/if}
				{#if result === 'failed'}{copy.failed}{/if}
			</p>
		</form>
	</section>
</div>
