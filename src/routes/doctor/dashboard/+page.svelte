<script lang="ts">
	import {
		appointmentService,
		availabilityService,
		DEMO_DOCTOR_ID,
		DEMO_PRACTICE_ID,
		factsService,
		practiceService
	} from '$lib/application/services';
	import { appointments, availability, preferences, role } from '$lib/stores/app';
	import { fill, greetingKey, t, uiLanguage } from '$lib/i18n';
	import { CANCEL_MIN_NOTICE_HOURS } from '$lib/config/clinicPolicy';
	import { CHANNEL_TO_SYSTEM, getSystemById } from '$lib/domain/externalSystems/catalog';
	import { goto } from '$app/navigation';
	import { toISODate } from '$lib/domain/scheduling/slotCalendar';
	import {
		badgeClass,
		firstName,
		formatApptDate,
		formatTime
	} from '$lib/ui/clinicFormat';
	import type { ActionId } from '$lib/domain/appointment/lifecycleEngine';
	import FactsCarousel from '$lib/components/facts/FactsCarousel.svelte';

	$effect(() => {
		if ($role !== 'doctor') role.set('doctor');
	});

	let lang = $derived(uiLanguage($preferences.language));
	const practiceId = DEMO_PRACTICE_ID;
	const doctorId = DEMO_DOCTOR_ID;
	const today = toISODate(new Date());

	let doctorName = $derived(
		practiceService.get(practiceId)?.doctors.find((d) => d.id === doctorId)?.name ||
			'Dr. Olivia Turner'
	);
	let helloName = $derived(
		firstName(doctorName.replace(', M.D.', '').replace(/^Dr\.?\s+/i, ''))
	);

	let upcoming = $derived(
		$appointments
			.filter(
				(a) =>
					a.practiceId === practiceId &&
					a.doctorId === doctorId &&
					a.date >= today &&
					a.status !== 'cancelled' &&
					a.status !== 'rejected'
			)
			.map((a) => appointmentService.view(a, 'doctor'))
			.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
	);
	let todays = $derived(upcoming.filter((a) => a.date === today));
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
		return availabilityService.dayTimeline({ practiceId, doctorId, date: today });
	});
	let factCards = $derived.by(() => {
		void $appointments;
		return factsService.forDoctor(practiceId);
	});
	let factHeading = $derived(
		todays.length || pending.length ? 'Clinic facts' : 'Before the first booking'
	);

	function bookerName(practiceId: string) {
		const id = CHANNEL_TO_SYSTEM[practiceService.get(practiceId)?.bookingChannel || ''];
		return id ? getSystemById(id)?.name : undefined;
	}

	function removalLabel(visit: { loggedExternally?: boolean; practiceId: string }) {
		return visit.loggedExternally || bookerName(visit.practiceId)
			? t(lang, 'visit.delete')
			: t(lang, 'visit.cancel');
	}

	async function act(id: string, action: Extract<ActionId, 'confirm' | 'reject' | 'cancel' | 'join_video'>) {
		try {
			if (action === 'join_video') {
				goto(`/video?id=${id}&role=doctor`);
				return;
			}
			if (action === 'cancel') {
				const visit = $appointments.find((a) => a.id === id);
				const booker = visit ? bookerName(visit.practiceId) : undefined;
				const external = Boolean(visit?.loggedExternally || booker);
				const message = external
					? fill(lang, 'visit.deleteConfirm', { system: booker || '' })
					: t(lang, 'visit.cancelConfirm');
				if (!confirm(message)) return;
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
		<h1>{t(lang, greetingKey())}, {helloName}</h1>
		<p class="sub">Today’s clinic and every visit still ahead.</p>
		<p class="policy-hint">{fill(lang, 'policy.cancel', { hours: String(CANCEL_MIN_NOTICE_HOURS) })}</p>
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
							>{removalLabel(a)}</button
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
						>{n.callStartedAt ? 'Rejoin visit' : 'Start visit'}</button
					>
				{/if}
				{#if n.allowedActions.includes('cancel')}
					<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(n.id, 'cancel')}
						>{removalLabel(n)}</button
					>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="next-patient empty">
		<div class="eyebrow">Next patient</div>
		<h2>No visits scheduled today</h2>
	</div>
{/if}

<div class="doctor-layout">
	<div class="timeline">
		<h2 class="section-title">Today’s timeline</h2>
		{#if timeline.slots.length === 0}
			<p class="policy-hint">
				No times opened today — open hours on
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
		<h3>{t(lang, 'dash.upcoming')}</h3>
		{#if upcoming.length === 0}
			<p style="color:var(--color-text-muted);font-size:0.875rem">No visits ahead.</p>
		{:else}
			{#each upcoming as a}
				<div class="queue-item">
					<div class="name">{a.patientName} <span class={badgeClass(a.badge)}>{a.label}</span></div>
					<div class="info">{formatApptDate(a.date)} · {formatTime(a.time)} · {a.reason}</div>
					<div class="appt-actions">
						{#if a.status === 'requested'}
							<button class="btn btn-primary btn-sm" type="button" onclick={() => act(a.id, 'confirm')}
								>Confirm</button
							>
						{:else if a.allowedActions.includes('join_video')}
							<button class="btn btn-primary btn-sm" type="button" onclick={() => act(a.id, 'join_video')}
								>{a.callStartedAt ? 'Rejoin' : 'Start visit'}</button
							>
						{/if}
						{#if a.allowedActions.includes('cancel')}
							<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(a.id, 'cancel')}
								>{removalLabel(a)}</button
							>
						{/if}
						<a class="btn btn-ghost btn-sm" href={`/doctor/appointment/${a.id}`}>Details</a>
					</div>
				</div>
			{/each}
		{/if}
	</aside>
</div>
