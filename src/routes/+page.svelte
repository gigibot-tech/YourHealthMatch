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

<div class="landing">
	<section class="landing-hero">
		<header class="landing-bar">
			<span class="landing-mark" aria-hidden="true"></span>
			<span>YourHealthMatch</span>
		</header>

		<div class="landing-hero-grid">
			<div>
				<p class="landing-kicker">Germany</p>
				<h1>A doctor who already speaks your language.</h1>
				<p class="landing-lead">
					Germany is the first pilot country. Join as a test patient looking for a doctor, or as a
					clinic or doctor.
				</p>
				<ul class="landing-langs" aria-label="Languages in the trial">
					{#each languages as name}
						<li>{name}</li>
					{/each}
				</ul>
			</div>

			<form class="landing-card" onsubmit={join}>
				<fieldset class="landing-who">
					<legend>Who is joining</legend>
					<label>
						<input type="radio" name="who" value="test_patient" bind:group={who} />
						Test patient
					</label>
					<label>
						<input type="radio" name="who" value="clinic" bind:group={who} />
						Clinic or doctor
					</label>
				</fieldset>
				<label for="waitlist-email">Email</label>
				<p>One address. Used only to invite you into the Germany pilot.</p>
				<div class="landing-row">
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
					<button class="btn btn-primary" type="submit" disabled={pending}>
						{pending ? 'Saving…' : 'Join the trial'}
					</button>
				</div>
				<p class="landing-status" aria-live="polite">
					{#if result === 'joined'}You’re on the list. We’ll write when the Germany pilot opens for you.{/if}
					{#if result === 'already'}That email is already on the list for this role.{/if}
					{#if result === 'invalid'}Enter a full email address.{/if}
					{#if result === 'unavailable'}The waitlist is not connected yet.{/if}
					{#if result === 'failed'}Could not save that email. Try again in a moment.{/if}
				</p>
			</form>
		</div>

		<a class="landing-cue" href="#demo">Try the demo</a>
	</section>

	<section id="demo" class="landing-demo">
		<div class="landing-demo-inner">
			<p class="landing-kicker">Germany</p>
			<h2>Germany is the first pilot country.</h2>
			<p>The Greifswald clinic is the demo. No account.</p>
			<div class="landing-demo-grid">
				<article>
					<strong>I’m looking for a doctor</strong>
					<span>Language, insurance, then a match.</span>
					<div class="actions">
						<button class="btn btn-primary btn-sm" type="button" onclick={() => start('patient')}
							>Start as patient</button
						>
						<SkipOnboardingButton role="patient" compact />
					</div>
				</article>
				<article>
					<strong>I’m the clinic</strong>
					<span>Practice setup, schedule, open times.</span>
					<div class="actions">
						<button class="btn btn-sm" type="button" onclick={() => start('doctor')}
							>Start as doctor</button
						>
						<SkipOnboardingButton role="doctor" compact />
					</div>
				</article>
			</div>
		</div>
	</section>
</div>
