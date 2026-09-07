<script lang="ts">
	import { goto } from '$app/navigation';
	import { startSession, type SessionRole } from '$lib/application/services';

	function start(nextRole: SessionRole, skipOnboarding: boolean) {
		goto(startSession({ role: nextRole, skipOnboarding }));
	}
</script>

<div id="role-picker">
	<div class="role-card-wrap">
		<h1>Who is signing in?</h1>
		<p>
			Start from the beginning, or skip onboarding and use the local Greifswald demo clinic.
		</p>
		<div class="role-grid">
			<div class="role-choice">
				<div class="role-icon">👤</div>
				<strong>I'm a patient</strong>
				<span>Language, systems, and requirements, then match and book</span>
				<div class="actions">
					<button class="btn btn-primary btn-sm" type="button" onclick={() => start('patient', false)}
						>Start onboarding</button
					>
					<button class="btn btn-ghost btn-sm" type="button" onclick={() => start('patient', true)}
						>Skip — local data</button
					>
				</div>
			</div>
			<div class="role-choice">
				<div class="role-icon">🩺</div>
				<strong>I'm a doctor</strong>
				<span>Practice profile, then queue and open times</span>
				<div class="actions">
					<button class="btn btn-primary btn-sm" type="button" onclick={() => start('doctor', false)}
						>Start onboarding</button
					>
					<button class="btn btn-ghost btn-sm" type="button" onclick={() => start('doctor', true)}
						>Skip — local data</button
					>
				</div>
			</div>
		</div>
	</div>
</div>
