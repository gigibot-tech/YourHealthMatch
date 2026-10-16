<script lang="ts">
	import { goto } from '$app/navigation';
	import { joinTestSeekerWaitlist, type WaitlistJoinResult } from '$lib/adapters/testSeekerWaitlist';
	import { startSession, type SessionRole } from '$lib/application/services';
	import MatchCircles from '$lib/components/marketing/MatchCircles.svelte';
	import SiteFooter from '$lib/components/marketing/SiteFooter.svelte';
	import SiteHeader from '$lib/components/marketing/SiteHeader.svelte';
	import SkipOnboardingButton from '$lib/components/session/SkipOnboardingButton.svelte';
	import { LANDING, type LandingLang } from '$lib/i18n/landing';
	import { preferences } from '$lib/stores/app';

	type Sample = {
		name: string;
		type: 'eye' | 'skin' | 'gp' | 'dentist';
		langs: string[];
		ins: string[];
		line: string;
		place: string;
	};

	const samplesByLang: Record<LandingLang, Sample[]> = {
		EN: [
			{
				name: 'Sample eye doctor',
				type: 'eye',
				langs: ['EN', 'DE', 'AR'],
				ins: ['GKV', 'PKV'],
				line: 'English · Arabic · Public insurance',
				place: 'Greifswald'
			},
			{
				name: 'Sample skin doctor',
				type: 'skin',
				langs: ['EN', 'DE', 'AR'],
				ins: ['GKV', 'PKV'],
				line: 'English · German · Public insurance',
				place: 'Greifswald'
			},
			{
				name: 'Sample family doctor',
				type: 'gp',
				langs: ['DE', 'EN'],
				ins: ['GKV'],
				line: 'English · German · Public insurance',
				place: 'Greifswald'
			},
			{
				name: 'Sample dentist',
				type: 'dentist',
				langs: ['DE', 'EN'],
				ins: ['GKV'],
				line: 'English · German · Public insurance',
				place: 'Greifswald'
			}
		],
		DE: [
			{
				name: 'Beispiel-Augenärztin',
				type: 'eye',
				langs: ['EN', 'DE', 'AR'],
				ins: ['GKV', 'PKV'],
				line: 'Englisch · Arabisch · Gesetzlich',
				place: 'Greifswald'
			},
			{
				name: 'Beispiel-Hautarzt',
				type: 'skin',
				langs: ['EN', 'DE', 'AR'],
				ins: ['GKV', 'PKV'],
				line: 'Englisch · Deutsch · Gesetzlich',
				place: 'Greifswald'
			},
			{
				name: 'Beispiel-Hausärztin',
				type: 'gp',
				langs: ['DE', 'EN'],
				ins: ['GKV'],
				line: 'Englisch · Deutsch · Gesetzlich',
				place: 'Greifswald'
			},
			{
				name: 'Beispiel-Zahnarzt',
				type: 'dentist',
				langs: ['DE', 'EN'],
				ins: ['GKV'],
				line: 'Englisch · Deutsch · Gesetzlich',
				place: 'Greifswald'
			}
		]
	};

	const stepHref = ['#find', '#match', '#home'] as const;

	let email = $state('');
	let who = $state<'test_patient' | 'clinic'>('test_patient');
	let pending = $state(false);
	let result = $state<WaitlistJoinResult | null>(null);
	let place = $state('Greifswald');
	let care = $state('any');
	let spoken = $state('any');
	let cover = $state('any');
	let lang = $derived<LandingLang>($preferences.language === 'DE' ? 'DE' : 'EN');
	const copy = $derived(LANDING[lang]);
	const hits = $derived(
		place === 'Berlin'
			? []
			: samplesByLang[lang].filter(
					(doctor) =>
						(care === 'any' || doctor.type === care) &&
						(spoken === 'any' || doctor.langs.includes(spoken)) &&
						(cover === 'any' || doctor.ins.includes(cover))
				)
	);

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

	<section class="home-hero">
		<div>
			<p class="kicker">{copy.heroKicker}</p>
			<h1>{copy.heroTitle}</h1>
			<p class="lede">{copy.heroSub}</p>
			<div class="home-actions">
				<a class="site-cta" href="#demo">{copy.heroCta}</a>
				<a class="site-cta site-cta-ghost" href="#home">{copy.heroWaitlist}</a>
			</div>
		</div>
		<div class="home-scene" aria-hidden="true">
			<svg viewBox="0 0 520 420">
				<g fill="none" stroke="#c9d5ce" stroke-width="10" stroke-linecap="round">
					<path d="M20 90 H500 M20 190 H500 M20 300 H500 M90 20 V400 M220 20 V400 M360 20 V400" />
				</g>
				<path
					d="M70 320 C140 320 160 230 230 190 S340 120 430 110"
					fill="none"
					stroke="#123C3A"
					stroke-width="3"
					stroke-dasharray="7 8"
				/>
				<circle cx="70" cy="320" r="14" fill="#d8f36a" stroke="#123C3A" stroke-width="2" />
				<circle cx="230" cy="190" r="7" fill="#123C3A" />
				<circle cx="430" cy="110" r="8" fill="#ff806b" stroke="#123C3A" stroke-width="2" />
			</svg>
			<article class="float-card float-card-a">
				<strong>{samplesByLang[lang][0].name}</strong>
				<span>{samplesByLang[lang][0].line}</span>
				<span>{samplesByLang[lang][0].place}</span>
			</article>
			<article class="float-card float-card-b">
				<strong>{samplesByLang[lang][2].name}</strong>
				<span>{samplesByLang[lang][2].line}</span>
				<span>{samplesByLang[lang][2].place}</span>
			</article>
		</div>
	</section>

	<section id="demo" class="band band-mint">
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

		<div class="sample-block">
			<p class="kicker">{copy.sampleKicker}</p>
			<h2>{copy.sampleTitle}</h2>
			<div class="sample-grid">
				<form class="sample-filters" id="find">
					<label for="loc">{copy.filterLocation}</label>
					<select id="loc" bind:value={place}>
						<option>Greifswald</option>
						<option>Berlin</option>
					</select>
					<label for="care">{copy.filterType}</label>
					<select id="care" bind:value={care}>
						<option value="any">{copy.filterAny}</option>
						<option value="gp">{copy.filterFamily}</option>
						<option value="dentist">{copy.filterDentist}</option>
						<option value="eye">{copy.filterEye}</option>
						<option value="skin">{copy.filterSkin}</option>
					</select>
					<label for="spoken">{copy.filterLanguage}</label>
					<select id="spoken" bind:value={spoken}>
						<option value="any">{copy.filterAny}</option>
						<option value="EN">{copy.filterEn}</option>
						<option value="DE">{copy.filterDe}</option>
						<option value="AR">{copy.filterAr}</option>
					</select>
					<label for="cover">{copy.filterInsurance}</label>
					<select id="cover" bind:value={cover}>
						<option value="any">{copy.filterAny}</option>
						<option value="GKV">{copy.filterPublic}</option>
						<option value="PKV">{copy.filterPrivate}</option>
					</select>
				</form>
				<div>
					<div class="sample-results" id="match" aria-live="polite">
						{#each hits as doctor (doctor.name)}
							<article class="sample-card">
								<span class="sample-pin" aria-hidden="true"></span>
								<div>
									<h3>{doctor.name}</h3>
									<p>{doctor.line}</p>
									<p>{doctor.place}</p>
								</div>
							</article>
						{:else}
							<p class="lede">{copy.sampleEmpty}</p>
						{/each}
					</div>
					<article id="home" class="wait-card">
						<h3>{copy.sampleHomeTitle}</h3>
						<p>{copy.sampleHomeBody}</p>
						<a class="site-cta" href="#join">{copy.sampleHomeCta}</a>
					</article>
				</div>
			</div>
		</div>
	</section>

	<section id="how" class="band">
		<p class="kicker">{copy.howKicker}</p>
		<h2>{copy.howTitle}</h2>
		<nav class="how-steps" aria-label={copy.navHow}>
			{#each copy.steps as step, i}
				<a href={stepHref[i]}>
					<p class="how-num">0{i + 1}</p>
					<h3>{step.title}</h3>
					<p>{step.body}</p>
				</a>
			{/each}
		</nav>
	</section>

	<section id="why" class="band">
		<MatchCircles {lang} />
	</section>

	<section class="band band-mint">
		<p class="kicker">{copy.whoKicker}</p>
		<h2>{copy.whoTitle}</h2>
		<div class="cards cards-3">
			{#each copy.who as item}
				<article>
					<h3>{item.title}</h3>
					<p>{item.body}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="band">
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

	<section id="join" class="band band-teal">
		<div class="join-close">
			<div>
				<p class="kicker">{copy.finalKicker}</p>
				<h2>{copy.finalTitle}</h2>
				<p class="lede">{copy.finalSub}</p>
			</div>
			<form class="join-form" onsubmit={join}>
				<fieldset>
					<legend>{copy.joinLegend}</legend>
					<label class="join-choice">
						<input type="radio" name="who" value="test_patient" bind:group={who} />
						{copy.interest}
					</label>
					<label class="join-choice">
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
	</section>

	<SiteFooter {lang} />
</div>
