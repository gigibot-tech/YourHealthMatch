<script lang="ts">
	import { goto } from '$app/navigation';
	import { joinTestSeekerWaitlist, type WaitlistJoinResult } from '$lib/adapters/testSeekerWaitlist';
	import { startSession, type SessionRole } from '$lib/application/services';
	import SkipOnboardingButton from '$lib/components/session/SkipOnboardingButton.svelte';

	let email = $state('');
	let who = $state<'test_patient' | 'clinic'>('test_patient');
	let pending = $state(false);
	let result = $state<WaitlistJoinResult | null>(null);

	const languages = ['Deutsch', 'English', 'Türkçe', 'العربية', 'Українська', 'Русский'];

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

<div class="landing" id="top">
	<nav class="fs-nav" aria-label="Page">
		<a class="fs-brand" href="#top">
			<span class="landing-mark" aria-hidden="true"></span>
			YourHealthMatch
		</a>
		<div class="fs-nav-links">
			<a href="#demo">Try the demo</a>
			<a href="#pilot">Germany</a>
			<a class="fs-nav-cta" href="#join">Join the trial</a>
		</div>
	</nav>

	<section class="fs-hero">
		<p class="fs-kicker">Germany · first pilot</p>
		<h1>
			<span>Your</span>
			<span>Health</span>
			<span>Match</span>
		</h1>
		<p class="fs-tag">A doctor who already speaks your language.</p>
	</section>

	<section id="pilot" class="fs-band">
		<p class="fs-kicker">Languages</p>
		<ul class="fs-langs" aria-label="Languages in the trial">
			{#each languages as name}
				<li>{name}</li>
			{/each}
		</ul>
		<p class="fs-line">
			Germany is the first pilot country. An interest in finding a doctor, and clinics or doctors,
			join the same list.
		</p>
	</section>

	<section id="demo" class="fs-band fs-demo">
		<p class="fs-kicker">Demo</p>
		<h2>The Greifswald clinic.</h2>
		<p class="fs-line">No account. Start from the beginning, or skip setup.</p>
		<div class="fs-paths">
			<article>
				<strong>I’m looking for a doctor</strong>
				<span>Language, insurance, then a match.</span>
				<div class="actions">
					<button class="fs-outline" type="button" onclick={() => start('patient')}>Start as patient</button>
					<SkipOnboardingButton role="patient" compact />
				</div>
			</article>
			<article>
				<strong>I’m the clinic</strong>
				<span>Practice setup, schedule, open times.</span>
				<div class="actions">
					<button class="fs-outline" type="button" onclick={() => start('doctor')}>Start as doctor</button>
					<SkipOnboardingButton role="doctor" compact />
				</div>
			</article>
		</div>
	</section>

	<section id="join" class="fs-band fs-join">
		<p class="fs-kicker">Waitlist</p>
		<h2>Join the Germany pilot.</h2>
		<form onsubmit={join}>
			<fieldset class="fs-who">
				<legend>Who is joining</legend>
				<label>
					<input type="radio" name="who" value="test_patient" bind:group={who} />
					Interest
				</label>
				<label>
					<input type="radio" name="who" value="clinic" bind:group={who} />
					Clinic or doctor
				</label>
			</fieldset>
			<label for="waitlist-email">Email</label>
			<input
				id="waitlist-email"
				name="email"
				type="email"
				autocomplete="email"
				inputmode="email"
				required
				placeholder="EMAIL"
				bind:value={email}
			/>
			<button class="fs-outline" type="submit" disabled={pending}>
				{pending ? 'Saving…' : 'Send'}
			</button>
			<p class="fs-status" aria-live="polite">
				{#if result === 'joined'}You’re on the list. We’ll write when the Germany pilot opens for you.{/if}
				{#if result === 'already'}That email is already on the list for this role.{/if}
				{#if result === 'invalid'}Enter a full email address.{/if}
				{#if result === 'unavailable'}The waitlist is not connected yet.{/if}
				{#if result === 'failed'}Could not save that email. Try again in a moment.{/if}
			</p>
		</form>
	</section>
</div>
