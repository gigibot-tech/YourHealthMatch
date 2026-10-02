<script lang="ts">
	import {
		appointmentService,
		DEMO_PATIENT_ID,
		factsService,
		practiceService
	} from '$lib/application/services';
	import { appointments, requirements } from '$lib/stores/app';
	import { dateStrip, toISODate } from '$lib/domain/scheduling/slotCalendar';
	import { goto } from '$app/navigation';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';
	import FactsCarousel from '$lib/components/facts/FactsCarousel.svelte';
	import ContactPracticeForm from '$lib/components/patient/ContactPracticeForm.svelte';
	import {
		badgeClass,
		cancelPolicyHint,
		firstName,
		formatApptDate,
		formatTime,
		greeting
	} from '$lib/ui/clinicFormat';
	import type { ActionId } from '$lib/domain/appointment/lifecycleEngine';

	const PATIENT_ID = DEMO_PATIENT_ID;
	const strip = dateStrip(7);
	let selectedDate = $state(toISODate(new Date()));

	let mine = $derived(
		$appointments
			.filter((a) => a.patientId === PATIENT_ID)
			.map((a) => appointmentService.view(a, 'patient'))
	);
	let upcoming = $derived(
		mine.filter((a) => a.status === 'requested' || a.status === 'confirmed')
	);
	let dayAppts = $derived(upcoming.filter((a) => a.date === selectedDate));
	let videoReady = $derived(upcoming.filter((a) => a.status === 'confirmed').length);
	let selectedLabel = $derived(strip.find((d) => d.iso === selectedDate)?.label || selectedDate);
	let helloName = $derived(firstName(mine[0]?.patientName || 'John'));
	let factCards = $derived.by(() => {
		void $appointments;
		void $requirements;
		return factsService.forPatient(PATIENT_ID);
	});
	let factHeading = $derived(
		upcoming.length ? 'While you wait' : 'Before you book'
	);

	function doctorLine(practiceId: string, doctorId?: string) {
		const practice = practiceService.get(practiceId);
		const doctor = doctorId ? practice?.doctors.find((d) => d.id === doctorId) : practice?.doctors[0];
		return {
			name: doctor?.name || practice?.name || 'Doctor',
			specialty: doctor?.specialty || practice?.specialties?.[0] || '',
			practiceName: practice?.name || ''
		};
	}

	async function act(id: string, action: Extract<ActionId, 'cancel' | 'join_video'>) {
		try {
			if (action === 'join_video') {
				goto(`/video?id=${id}&role=patient`);
				return;
			}
			if (!confirm('Cancel this appointment? The time slot will open again.')) return;
			await appointmentService.applyAction(id, action, 'patient');
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Action failed');
		}
	}
</script>

<div class="welcome-row">
	<div class="avatar">{helloName.slice(0, 1)}</div>
	<div>
		<h1 style="font-size:1.35rem;font-weight:700">{greeting()}, {helloName}</h1>
		<p class="sub">Here's your health overview.</p>
		<p class="policy-hint">
			{#if upcoming.length === 0}
				No visits booked yet.
			{:else}
				{upcoming.length} upcoming{videoReady ? ` · ${videoReady} ready for video` : ''}
			{/if}
		</p>
		<p class="policy-hint">{cancelPolicyHint()}</p>
	</div>
</div>

<FactsCarousel cards={factCards} heading={factHeading} />

<div class="date-strip">
	{#each strip as d}
		<button
			type="button"
			class="date-chip"
			class:active={d.iso === selectedDate}
			onclick={() => (selectedDate = d.iso)}
		>
			<div class="day">{d.day}</div>
			<div class="num">{d.dateNum}</div>
		</button>
	{/each}
</div>

<h2 class="section-title">{selectedLabel}</h2>
{#if dayAppts.length === 0}
	<div class="empty-state">No appointments on this day. <a href="/patient/match">Find a match</a></div>
{:else}
	{#each dayAppts as v}
		{@const doc = doctorLine(v.practiceId, v.doctorId)}
		<div class="card appt-card">
			<div class="meta">
				<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
					<h3>{doc.name}</h3>
					<span class={badgeClass(v.badge)}>{v.label}</span>
				</div>
				<div class="detail">{doc.specialty} · {formatTime(v.time)}</div>
				<div class="detail">{v.reason}</div>
			</div>
			<div class="appt-actions">
				{#if v.allowedActions.includes('join_video')}
					<button class="btn btn-primary btn-sm" type="button" onclick={() => act(v.id, 'join_video')}
						>Join Video</button
					>
				{:else if v.status === 'requested'}
					<button class="btn btn-ghost btn-sm" type="button" disabled>Awaiting confirm</button>
				{/if}
				{#if v.allowedActions.includes('cancel')}
					<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(v.id, 'cancel')}
						>Cancel</button
					>
				{/if}
			</div>
			<ContactPracticeForm compact practiceId={v.practiceId} doctorId={v.doctorId} />
		</div>
	{/each}
{/if}

<h2 class="section-title" style="margin-top:1.75rem">Upcoming appointments</h2>
{#if upcoming.length === 0}
	<div class="empty-state">Nothing booked yet. <a href="/patient/match">Find a match</a></div>
{:else}
	{#each upcoming.slice(0, 4) as v}
		{@const doc = doctorLine(v.practiceId, v.doctorId)}
		<div class="card appt-card">
			<div class="meta">
				<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
					<h3>{doc.name}</h3>
					<span class={badgeClass(v.badge)}>{v.label}</span>
				</div>
				<div class="detail">{formatApptDate(v.date)} at {formatTime(v.time)}</div>
				<div class="detail">{doc.practiceName}</div>
			</div>
			<div class="appt-actions">
				<a class="btn btn-ghost btn-sm" href="/patient/dashboard">View</a>
			</div>
			<ContactPracticeForm compact practiceId={v.practiceId} doctorId={v.doctorId} />
		</div>
	{/each}
{/if}

<div style="margin-top:1.75rem">
	<ExternalSystemLinks onlySaved title="Your saved booking / telemedicine apps" />
</div>
