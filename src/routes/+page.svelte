<script lang="ts">
	import { goto } from '$app/navigation';
	import { role } from '$lib/stores/app';

	function pick(r: 'patient' | 'doctor') {
		role.set(r);
		goto(r === 'patient' ? '/patient/language' : '/doctor/dashboard');
	}
</script>

<div class="hero">
	<div class="hero-card">
		<p class="detail">International patients ↔ suitable practices</p>
		<h1>YourHealthMatch</h1>
		<p>Find doctors by language, insurance, specialty, and availability — then book or join the waitlist.</p>
		<div class="role-grid">
			<button class="btn btn-primary" type="button" onclick={() => pick('patient')}>I am a patient</button>
			<button class="btn" type="button" onclick={() => pick('doctor')}>I am a doctor / practice</button>
		</div>
	</div>
</div>
