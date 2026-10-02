<script lang="ts">
	import {
		appointmentService,
		availabilityService,
		DEMO_DOCTOR_ID,
		DEMO_PRACTICE_ID,
		factsService,
		practiceService
	} from '$lib/application/services';
	import { appointments, availability, role } from '$lib/stores/app';
	import { goto } from '$app/navigation';
	import { dateStrip, toISODate } from '$lib/domain/scheduling/slotCalendar';
	import {
		badgeClass,
		cancelPolicyHint,
		firstName,
		formatTime,
		greeting
	} from '$lib/ui/clinicFormat';
	import type { ActionId } from '$lib/domain/appointment/lifecycleEngine';
	import FactsCarousel from '$lib/components/facts/FactsCarousel.svelte';

	$effect(() => {
		if ($role !== 'doctor') role.set('doctor');
	});

	const practiceId = DEMO_PRACTICE_ID;
	const doctorId = DEMO_DOCTOR_ID;
	const today = toISODate(new Date());
	const strip = dateStrip(7);
	let selectedDate = $state(today);

	let doctorName = $derived(
		practiceService.get(practiceId)?.doctors.find((d) => d.id === doctorId)?.name ||
			'Dr. Olivia Turner'
	);
	let helloName = $derived(
		firstName(doctorName.replace(', M.D.', '').replace(/^Dr\.?\s+/i, ''))
	);

	let todays = $derived(
		$appointments
			.filter(
				(a) =>
					a.practiceId === practiceId &&
					a.doctorId === doctorId &&
					a.date === selectedDate &&
					a.status !== 'cancelled' &&
					a.status !== 'rejected'
			)
			.map((a) => appointmentService.view(a, 'doctor'))
			.sort((a, b) => a.time.localeCompare(b.time))
	);
	let pending = $derived(
		$appointments
			.filter(
				(a) =>
					a.practiceId === practiceId &&
					a.doctorId === doctorId &&
					a.status === 'requested'
			)
			.map((a) => appointmentService.view(a, 'doctor'))
	);
	let next = $derived(todays.find((a) => a.status === 'confirmed') || todays[0] || null);
	let byId = $derived(Object.fromEntries(todays.map((a) => [a.id, a])));
	let timeline = $derived.by(() => {
		void $availability;
		void $appointments;
		return availabilityService.dayTimeline({ practiceId, doctorId, date: selectedDate });
	});
	let selectedLabel = $derived(strip.find((d) => d.iso === selectedDate)?.label || selectedDate);
	let clinicLine = $derived.by(() => {
		const visitBit = todays.length === 1 ? '1 visit' : `${todays.length} visits`;
		const waitBit = pending.length
			? ` · ${pending.length} waiting to confirm`
			: '';
		const nextBit = next ? ` · next at ${formatTime(next.time)}` : '';
		return `${visitBit}${waitBit}${nextBit}`;
	});
	let factCards = $derived.by(() => {
		void $appointments;
		return factsService.forDoctor(practiceId);
	});
	let factHeading = $derived(
		todays.length || pending.length ? 'Clinic facts' : 'Before the first booking'
	);

	async function act(id: string, action: Extract<ActionId, 'confirm' | 'reject' | 'cancel' | 'join_video'>) {
		try {
			if (action === 'join_video') {
				goto(`/video?id=${id}&role=doctor`);
				return;
			}
			if (action === 'cancel' && !confirm('Cancel this appointment? The time slot will open again.')) {
				return;
			}
			await appointmentService.applyAction(id, action, 'doctor');
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Failed');
		}
	}

	function timelineClick(id: string, status: string) {
		if (status === 'requested') act(id, 'confirm');
		else if (status === 'confirmed') act(id, 'join_video');
		else goto(`/doctor/appointment/${id}`);
	}
</script>

<div class="page-header">
	<div>
		<h1>{greeting()}, {helloName}</h1>
		<p class="sub">{selectedLabel} · {selectedDate === today ? "Today’s clinic" : 'Clinic day'}</p>
		<p class="policy-hint">{clinicLine}</p>
		<p class="policy-hint">{cancelPolicyHint()}</p>
	</div>
</div>

<FactsCarousel cards={factCards} heading={factHeading} />

{#if pending.length}
	<div class="pending-strip">
		{#each pending as a}
			<div class="pending-chip">
				<span><strong>{a.patientName}</strong> · {formatTime(a.time)} · {a.reason}</span>
				<div class="appt-actions">
					<button class="btn btn-primary btn-sm" type="button" onclick={() => act(a.id, 'confirm')}
						>Confirm</button
					>
					{#if a.allowedActions.includes('cancel')}
						<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(a.id, 'cancel')}
							>Cancel</button
						>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

{#if next}
	{@const n = next}
	<div class="next-patient">
		<div class="eyebrow">Next patient</div>
		<h2>{n.patientName}</h2>
		<p class="reason">{n.reason} · {formatTime(n.time)}</p>
		<div class="row">
			<span class={badgeClass(n.badge)}>{n.label}</span>
			<div class="appt-actions">
				{#if n.status === 'requested'}
					<button class="btn btn-primary" type="button" onclick={() => act(n.id, 'confirm')}
						>Confirm visit</button
					>
				{:else if n.allowedActions.includes('join_video')}
					<button class="btn btn-primary" type="button" onclick={() => act(n.id, 'join_video')}
						>Join Video Call</button
					>
				{/if}
				{#if n.allowedActions.includes('cancel')}
					<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(n.id, 'cancel')}
						>Cancel</button
					>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="next-patient empty">
		<div class="eyebrow">Next patient</div>
		<h2>No visits scheduled {selectedDate === today ? 'today' : 'this day'}</h2>
	</div>
{/if}

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

<div class="doctor-layout">
	<div class="timeline">
		<h2 class="section-title">
			{selectedDate === today ? "Today’s timeline" : `${selectedLabel}`}
		</h2>
		{#if timeline.slots.length === 0}
			<p class="policy-hint">
				No times opened {selectedDate === today ? 'today' : 'this day'} — open hours on
				<a href="/doctor/schedule">Schedule</a>.
			</p>
		{:else}
			{#each timeline.slots as slot}
				{@const visit = slot.appointmentId ? byId[slot.appointmentId] : null}
				<div class="timeline-row">
					<div class="timeline-hour">{formatTime(slot.time)}</div>
					<div class="timeline-slot">
						{#if visit}
							<button
								type="button"
								class="timeline-chip"
								class:pending={visit.status === 'requested'}
								onclick={() => timelineClick(visit.id, visit.status)}
							>
								<strong>{visit.patientName}</strong>
								{visit.reason} · {formatTime(visit.time)}
							</button>
						{:else}
							<span class="timeline-open">Open</span>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<aside class="queue-panel">
		<h3>Queue</h3>
		{#if todays.length === 0}
			<p style="color:var(--color-text-muted);font-size:0.875rem">No patients in queue.</p>
		{:else}
			{#each todays as a}
				<div class="queue-item">
					<div class="name">{a.patientName} <span class={badgeClass(a.badge)}>{a.label}</span></div>
					<div class="info">{formatTime(a.time)} · {a.reason}</div>
					<div class="appt-actions">
						{#if a.status === 'requested'}
							<button class="btn btn-primary btn-sm" type="button" onclick={() => act(a.id, 'confirm')}
								>Confirm</button
							>
						{:else if a.allowedActions.includes('join_video')}
							<button class="btn btn-primary btn-sm" type="button" onclick={() => act(a.id, 'join_video')}
								>Join</button
							>
						{/if}
						{#if a.allowedActions.includes('cancel')}
							<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(a.id, 'cancel')}
								>Cancel</button
							>
						{/if}
						<a class="btn btn-ghost btn-sm" href={`/doctor/appointment/${a.id}`}>Details</a>
					</div>
				</div>
			{/each}
		{/if}
	</aside>
</div>
