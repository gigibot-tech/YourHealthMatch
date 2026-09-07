<script lang="ts">
	import { goto } from '$app/navigation';
	import { role } from '$lib/stores/app';

	function pick(r: 'patient' | 'doctor') {
		role.set(r);
		goto(r === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
	}
</script>

<div class="role-picker">
	<div class="role-card-wrap">
		<h1>YourHealthMatch</h1>
		<p>Find the right doctor — then book, waitlist, or join a video visit.</p>
		<div class="role-grid">
			<button class="role-choice" type="button" onclick={() => pick('patient')}>
				<div class="role-icon">👤</div>
				<strong>I'm a patient</strong>
				<span>Match, book, and join visits</span>
			</button>
			<button class="role-choice" type="button" onclick={() => pick('doctor')}>
				<div class="role-icon">🩺</div>
				<strong>I'm a doctor</strong>
				<span>Confirm requests and run clinic</span>
			</button>
		</div>
	</div>
</div>
