<script lang="ts">
	import {
		appointmentService,
		DEMO_DOCTOR_ID,
		DEMO_PRACTICE_ID,
		factsService,
		practiceService
	} from '$lib/application/services';
	import { interestRepo } from '$lib/adapters/localRepos';
	import { appointments, availability, preferences, role } from '$lib/stores/app';
	import { fill, greetingKey, t, uiLanguage } from '$lib/i18n';
	import { CANCEL_MIN_NOTICE_HOURS } from '$lib/config/clinicPolicy';
	import { CHANNEL_TO_SYSTEM, getSystemById } from '$lib/domain/externalSystems/catalog';
	import { resolveVideoAccess, type VideoAccess } from '$lib/domain/video/videoAccess';
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

	let todays = $derived(
		$appointments
			.filter(
				(a) =>
					a.practiceId === practiceId &&
					a.doctorId === doctorId &&
					a.date === today &&
					a.status !== 'cancelled' &&
					a.status !== 'rejected'
			)
			.map((a) => appointmentService.view(a, 'doctor'))
			.sort((a, b) => a.time.localeCompare(b.time))
	);
	/** Future days only — today is owned by the timeline + next-patient strip. */
	let later = $derived(
		$appointments
			.filter(
				(a) =>
					a.practiceId === practiceId &&
					a.doctorId === doctorId &&
					a.date > today &&
					a.status !== 'cancelled' &&
					a.status !== 'rejected'
			)
			.map((a) => appointmentService.view(a, 'doctor'))
			.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
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
			.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
	);
	let next = $derived(todays.find((a) => a.status === 'confirmed') || todays[0] || null);
	let byId = $derived(Object.fromEntries(todays.map((a) => [a.id, a])));
	let timeline = $derived.by(() => {
		void $availability;
		void $appointments;
		return practiceService.dayTimeline({ practiceId, doctorId, date: today });
	});
	let interests = $state(interestRepo.getAll());
	$effect(() => {
		return interestRepo.subscribe((rows) => {
			interests = rows;
		});
	});
	let openToday = $derived(timeline.slots.filter((slot) => !slot.appointmentId));
	let waitlist = $derived(
		interests.filter((row) => row.intent === 'waitlist' || row.intent === 'beta')
	);
	let factCards = $derived.by(() => {
		void $appointments;
		void interests;
		return factsService.forDoctor(practiceId);
	});
	let factHeading = $derived(
		todays.length || pending.length ? 'Clinic facts' : 'Before the first booking'
	);

	function videoPlace(visit: {
		practiceId: string;
		doctorId?: string;
		modality: 'in_person' | 'video' | 'either';
	}): VideoAccess {
		const clinic = practiceService.get(visit.practiceId);
		const doctor = clinic?.doctors.find((d) => d.id === visit.doctorId);
		return resolveVideoAccess({ practice: clinic, doctor, modality: visit.modality });
	}

	function bookerName(practiceId: string) {
		const id = CHANNEL_TO_SYSTEM[practiceService.get(practiceId)?.bookingChannel || ''];
		return id ? getSystemById(id)?.name : undefined;
	}

	function removalLabel(visit: { loggedExternally?: boolean; practiceId: string }) {
		return visit.loggedExternally || bookerName(visit.practiceId)
			? t(lang, 'visit.delete')
			: t(lang, 'visit.cancel');
	}

	async function act(
		id: string,
		action: Extract<ActionId, 'confirm' | 'reject' | 'cancel' | 'complete' | 'join_video'>
	) {
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
		else if (status === 'confirmed') {
			const visit = $appointments.find((a) => a.id === id);
			if (visit && videoPlace(visit).kind === 'in_app') act(id, 'join_video');
			else goto(`/doctor/appointment/${id}`);
		} else goto(`/doctor/appointment/${id}`);
	}
</script>

<div class="page-header">
	<div>
		<h1>{t(lang, greetingKey())}, {helloName}</h1>
		<p class="sub">Confirm requests, run today’s visits, and see what’s coming next.</p>
		<p class="policy-hint">{fill(lang, 'policy.cancel', { hours: String(CANCEL_MIN_NOTICE_HOURS) })}</p>
	</div>
</div>

<section class="clinic-board" aria-label="Clinic day">
	<article>
		<h2>Open capacity</h2>
		<p class="clinic-count">{openToday.length} open today</p>
		{#if openToday.length === 0}
			<p class="detail">No open times today. <a href="/doctor/schedule">Open hours</a>.</p>
		{:else}
			<ul>
				{#each openToday as slot}
					<li>{formatTime(slot.time)}</li>
				{/each}
			</ul>
		{/if}
	</article>
	<article>
		<h2>Waitlist</h2>
		<p class="clinic-count">{waitlist.length} waiting</p>
		{#if waitlist.length === 0}
			<p class="detail">No one has asked for a time that is not open yet.</p>
		{:else}
			<ul>
				{#each waitlist as row}
					<li>
						<strong>{row.email}</strong>
						{row.note || row.symptomId || 'A visit'}
						· {row.requirements.language || '—'}
						· {row.requirements.location || row.requirements.city || '—'}
						· {row.requirements.insurance || '—'}
					</li>
				{/each}
			</ul>
		{/if}
	</article>
	<article>
		<h2>Incoming patients</h2>
		<p class="clinic-count">{pending.length} to confirm</p>
		{#if pending.length === 0}
			<p class="detail">No visit is waiting for you to confirm.</p>
		{:else}
			<ul class="incoming-list">
				{#each pending as a}
					<li>
						<strong>{a.patientName}</strong>
						{a.reason} · {a.date === today
							? formatTime(a.time)
							: `${formatApptDate(a.date)} · ${formatTime(a.time)}`}
						<button class="btn btn-primary" type="button" onclick={() => act(a.id, 'confirm')}
							>Confirm {a.patientName}</button
						>
						{#if a.allowedActions.includes('reject')}
							<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(a.id, 'reject')}
								>Decline</button
							>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</article>
</section>

{#if next}
	{@const n = next}
	{@const place = videoPlace(n)}
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
					{#if n.allowedActions.includes('reject')}
						<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(n.id, 'reject')}
							>Decline</button
						>
					{/if}
				{:else if n.allowedActions.includes('join_video') && place.kind === 'in_app'}
					<button class="btn btn-primary" type="button" onclick={() => act(n.id, 'join_video')}
						>{n.callStartedAt ? 'Rejoin visit' : 'Start visit'}</button
					>
				{:else if place.kind === 'external'}
					<p class="detail">Video opens on {place.systemName}</p>
				{/if}
				{#if n.allowedActions.includes('complete')}
					<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(n.id, 'complete')}
						>Complete</button
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
		<h3>{t(lang, 'dash.later')}</h3>
		<p class="queue-hint">
			Today lives in the timeline. Open times on
			<a href="/doctor/schedule">Schedule</a>.
		</p>
		{#if later.length === 0}
			<p class="queue-empty">Nothing booked after today.</p>
		{:else}
			{#each later as a}
				<div class="queue-item">
					<div class="name">{a.patientName} <span class={badgeClass(a.badge)}>{a.label}</span></div>
					<div class="info">{formatApptDate(a.date)} · {formatTime(a.time)} · {a.reason}</div>
					<div class="appt-actions">
						{#if a.status === 'requested'}
							<button class="btn btn-primary btn-sm" type="button" onclick={() => act(a.id, 'confirm')}
								>Confirm</button
							>
							{#if a.allowedActions.includes('reject')}
								<button class="btn btn-ghost btn-sm" type="button" onclick={() => act(a.id, 'reject')}
									>Decline</button
								>
							{/if}
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

<FactsCarousel cards={factCards} heading={factHeading} />
