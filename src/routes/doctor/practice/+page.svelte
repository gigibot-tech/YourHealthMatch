<script lang="ts">
	import { interestService, practiceService } from '$lib/application/services';
	import SkipOnboardingButton from '$lib/components/session/SkipOnboardingButton.svelte';
	import { practices } from '$lib/stores/app';
	import type { Practice } from '$lib/domain/practice/practiceProfileDefaults';
	import { normalizeLanguageList } from '$lib/domain/languages';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';
	import { page } from '$app/stores';

	const practiceId = 'prac_turner';
	let practice = $derived($practices.find((p) => p.id === practiceId) ?? practiceService.get(practiceId));
	let form = $state({
		name: '',
		languages: '',
		specialties: '',
		insuranceAccepted: '',
		kvApproved: false,
		location: '',
		postcode: '',
		acceptingNewPatients: true,
		modalities: { in_person: true, video: false },
		doctors: [] as { id: string; name: string; videoEnabled: boolean }[],
		bookingChannel: 'direct' as Practice['bookingChannel'],
		bookingUrl: ''
	});
	let hydratedId = $state<string | null>(null);

	$effect(() => {
		if (!practice || hydratedId === practice.id) return;
		hydratedId = practice.id;
		form = {
			name: practice.name,
			languages: practice.languages.join(', '),
			specialties: practice.specialties.join(', '),
			insuranceAccepted: practice.insuranceAccepted.join(', '),
			kvApproved: practice.kvApproved === true,
			location: practice.location,
			postcode: practice.postcode,
			acceptingNewPatients: practice.acceptingNewPatients === true,
			modalities: {
				in_person: practice.modalities.includes('in_person'),
				video: practice.modalities.includes('video')
			},
			doctors: practice.doctors.map((d) => ({
				id: d.id,
				name: d.name,
				videoEnabled: d.videoEnabled !== false
			})),
			bookingChannel: practice.bookingChannel,
			bookingUrl: practice.bookingUrl
		};
	});

	$effect(() => {
		const hash = $page.url.hash.replace(/^#/, '');
		if (!hash || typeof document === 'undefined') return;
		queueMicrotask(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
	});

	let demand = $derived(interestService.aggregateDemand());
	let savedMsg = $state('');
	let booksElsewhere = $derived(
		form.bookingChannel !== 'direct' && form.bookingChannel !== 'phone'
	);

	function save(e: Event) {
		e.preventDefault();
		const modalities = [
			...(form.modalities.in_person ? ['in_person'] : []),
			...(form.modalities.video ? ['video'] : [])
		];
		if (!modalities.length) {
			savedMsg = 'Pick at least one visit type (in person or video).';
			return;
		}
		const clinicVideo = form.modalities.video;
		const doctors = (practice?.doctors ?? []).map((d) => {
			const row = form.doctors.find((x) => x.id === d.id);
			return { ...d, videoEnabled: clinicVideo && row?.videoEnabled === true };
		});
		practiceService.saveProfile(practiceId, {
			name: form.name,
			languages: normalizeLanguageList(form.languages),
			specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
			insuranceAccepted: form.insuranceAccepted.split(',').map((s) => s.trim()).filter(Boolean),
			kvApproved: form.kvApproved,
			location: form.location,
			postcode: form.postcode,
			acceptingNewPatients: form.acceptingNewPatients,
			modalities,
			doctors,
			bookingChannel: form.bookingChannel,
			bookingUrl: form.bookingUrl,
			onboardingStatus: 'available_for_matching'
		});
		hydratedId = null;
		savedMsg = 'Practice saved — patients can match against these fields.';
	}
</script>

<div class="page-header">
	<div>
		<h1>Practice</h1>
		<p class="sub">
			This is your clinic record — not a personal doctor profile. Matching uses these fields:
			languages, specialties, insurance, place, new patients, and how people book.
		</p>
	</div>
</div>

{#if demand.length}
	<div class="card">
		<h3>Patient interest</h3>
		{#each demand as d}
			<p class="detail">
				<strong>{d.count}</strong> waiting for {d.symptomId !== 'any' ? d.symptomId : d.specialty}
				· {d.language} · {d.location}
			</p>
		{/each}
	</div>
{/if}

<form class="card" onsubmit={save}>
	<div class="field">
		<label for="name">Practice name</label>
		<input id="name" bind:value={form.name} />
	</div>
	<div class="field" id="languages">
		<label for="languages-input">Languages (codes: EN, DE, AR, TR, RU, UK)</label>
		<input id="languages-input" bind:value={form.languages} placeholder="EN, DE, AR" />
	</div>
	<div class="field" id="specialties">
		<label for="specialties-input">Specialties</label>
		<input id="specialties-input" bind:value={form.specialties} />
	</div>
	<div class="field">
		<label for="ins">Insurance accepted</label>
		<input id="ins" bind:value={form.insuranceAccepted} placeholder="GKV, PKV, self_pay" />
	</div>
	<div class="field">
		<label>
			<input type="checkbox" bind:checked={form.kvApproved} /> KV-Zulassung (required for GKV matching)
		</label>
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
	<div class="field" id="new-patients">
		<label>
			<input type="checkbox" bind:checked={form.acceptingNewPatients} /> Accepting new patients
		</label>
	</div>
	<div class="field" id="modalities">
		<span class="field-label">Visit types</span>
		<label>
			<input type="checkbox" bind:checked={form.modalities.in_person} /> In person
		</label>
		<label>
			<input type="checkbox" bind:checked={form.modalities.video} /> Video enabled for this clinic
		</label>
		{#if form.modalities.video}
			<p class="detail">
				Turn video on per doctor. If booking is in this app, those doctors open the room from the
				visit. If booking is Doctolib or similar, the video visit opens there instead.
			</p>
			{#each form.doctors as doctor (doctor.id)}
				<label>
					<input type="checkbox" bind:checked={doctor.videoEnabled} />
					{doctor.name} can take video visits
				</label>
			{/each}
		{/if}
	</div>
	<div class="field" id="booking">
		<label for="channel">How patients book</label>
		<select id="channel" bind:value={form.bookingChannel}>
			<option value="direct">In this app</option>
			<option value="doctolib">Doctolib</option>
			<option value="doctena">Doctena</option>
			<option value="arzt_direkt">arzt-direkt</option>
			<option value="cgm">CGM / Clickdoc</option>
			<option value="phone">Phone</option>
		</select>
	</div>
	{#if booksElsewhere}
		<div class="field">
			<label for="url">External booking URL</label>
			<input id="url" bind:value={form.bookingUrl} placeholder="https://…" />
		</div>
	{/if}
	<div class="actions">
		<button class="btn btn-primary" type="submit">Save practice</button>
		<SkipOnboardingButton role="doctor" />
	</div>
	{#if savedMsg}<p class="detail">{savedMsg}</p>{/if}
</form>

{#if booksElsewhere}
	<ExternalSystemLinks
		practiceId={practiceId}
		practiceOnly
		title="Patients open this link when they match your practice"
	/>
{/if}

<style>
	.field-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.35rem;
	}
	#modalities label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0.25rem 0;
	}
</style>
