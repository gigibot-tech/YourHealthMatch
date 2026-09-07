<script lang="ts">
	import { interestService, practiceService } from '$lib/application/services';
	import { practices } from '$lib/stores/app';
	import type { Practice } from '$lib/domain/practice/practiceProfileDefaults';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';

	const practiceId = 'prac_turner';
	let practice = $derived($practices.find((p) => p.id === practiceId) ?? practiceService.get(practiceId));
	let form = $state({
		name: '',
		languages: '',
		specialties: '',
		insuranceAccepted: '',
		location: '',
		postcode: '',
		acceptingNewPatients: true,
		bookingChannel: 'direct' as Practice['bookingChannel'],
		bookingUrl: ''
	});

	$effect(() => {
		if (!practice) return;
		form = {
			name: practice.name,
			languages: practice.languages.join(', '),
			specialties: practice.specialties.join(', '),
			insuranceAccepted: practice.insuranceAccepted.join(', '),
			location: practice.location,
			postcode: practice.postcode,
			acceptingNewPatients: practice.acceptingNewPatients === true,
			bookingChannel: practice.bookingChannel,
			bookingUrl: practice.bookingUrl
		};
	});

	let demand = $derived(interestService.aggregateDemand());
	let savedMsg = $state('');

	function save(e: Event) {
		e.preventDefault();
		practiceService.saveProfile(practiceId, {
			name: form.name,
			languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
			specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
			insuranceAccepted: form.insuranceAccepted.split(',').map((s) => s.trim()).filter(Boolean),
			location: form.location,
			postcode: form.postcode,
			acceptingNewPatients: form.acceptingNewPatients,
			bookingChannel: form.bookingChannel,
			bookingUrl: form.bookingUrl,
			onboardingStatus: 'available_for_matching'
		});
		savedMsg = 'Profile saved — eligible for matching.';
	}
</script>

<div class="page-header">
	<h1>Practice profile</h1>
	<p class="sub">Supply-side mirror of patient match fields.</p>
</div>

{#if demand.length}
	<div class="card">
		<h3>Patient interest</h3>
		{#each demand as d}
			<p class="detail">
				<strong>{d.count}</strong> waiting for {d.specialty} · {d.language} · {d.location}
			</p>
		{/each}
	</div>
{/if}

<form class="card" onsubmit={save}>
	<div class="field">
		<label for="name">Practice name</label>
		<input id="name" bind:value={form.name} />
	</div>
	<div class="field">
		<label for="languages">Languages (comma-separated)</label>
		<input id="languages" bind:value={form.languages} />
	</div>
	<div class="field">
		<label for="specialties">Specialties</label>
		<input id="specialties" bind:value={form.specialties} />
	</div>
	<div class="field">
		<label for="ins">Insurance accepted</label>
		<input id="ins" bind:value={form.insuranceAccepted} placeholder="GKV, PKV" />
	</div>
	<div class="field-row">
		<div class="field">
			<label for="location">Location</label>
			<input id="location" bind:value={form.location} />
		</div>
		<div class="field">
			<label for="plz">PLZ</label>
			<input id="plz" bind:value={form.postcode} />
		</div>
	</div>
	<div class="field">
		<label>
			<input type="checkbox" bind:checked={form.acceptingNewPatients} /> Accepting new patients
		</label>
	</div>
	<div class="field">
		<label for="channel">Booking channel</label>
		<select id="channel" bind:value={form.bookingChannel}>
			<option value="direct">Direct (YourHealthMatch)</option>
			<option value="doctolib">Doctolib</option>
			<option value="doctena">Doctena</option>
			<option value="arzt_direkt">arzt-direkt</option>
			<option value="cgm">CGM / Clickdoc</option>
			<option value="phone">Phone</option>
		</select>
	</div>
	<div class="field">
		<label for="url">External booking URL</label>
		<input id="url" bind:value={form.bookingUrl} />
	</div>
	<button class="btn btn-primary" type="submit">Save profile</button>
	{#if savedMsg}<p class="detail">{savedMsg}</p>{/if}
</form>

<ExternalSystemLinks
	practiceId={practiceId}
	title="Patients will see this launch when they pick your practice"
/>
