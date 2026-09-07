<script lang="ts">
	import { goto } from '$app/navigation';
	import { startSession, type SessionRole } from '$lib/application/services';
	import SkipOnboardingButton from '$lib/components/session/SkipOnboardingButton.svelte';

	function start(nextRole: SessionRole) {
		goto(startSession({ role: nextRole, skipOnboarding: false }));
	}
</script>

<div id="role-picker">
	<div class="role-card-wrap">
		<h1>Who is signing in?</h1>
		<p>
			Start from the beginning, or skip onboarding and use the Greifswald demo clinic.
		</p>
		<div class="role-grid">
			<div class="role-choice">
				<div class="role-icon">👤</div>
				<strong>I'm a patient</strong>
				<span>Fill your profile, then match and book</span>
				<div class="actions">
					<button class="btn btn-primary btn-sm" type="button" onclick={() => start('patient')}
						>Start onboarding</button
					>
					<SkipOnboardingButton role="patient" compact />
				</div>
			</div>
			<div class="role-choice">
				<div class="role-icon">🩺</div>
				<strong>I'm a doctor</strong>
				<span>Practice profile, then queue and open times</span>
				<div class="actions">
					<button class="btn btn-primary btn-sm" type="button" onclick={() => start('doctor')}
						>Start onboarding</button
					>
					<SkipOnboardingButton role="doctor" compact />
				</div>
			</div>
		</div>
	</div>
</div>
