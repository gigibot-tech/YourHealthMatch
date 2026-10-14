<script lang="ts">
	import {
		appointmentService,
		DEMO_PATIENT_ID,
		factsService,
		notificationService,
		practiceService
	} from '$lib/application/services';
	import { appointments, patientNotifications, requirements, preferences } from '$lib/stores/app';
	import {
		fill,
		greetingKey,
		reasonText,
		specialtyText,
		statusText,
		t,
		uiLanguage,
		uiLocale
	} from '$lib/i18n';
	import { CANCEL_MIN_NOTICE_HOURS } from '$lib/config/clinicPolicy';
	import { CHANNEL_TO_SYSTEM, getSystemById } from '$lib/domain/externalSystems/catalog';
	import { resolveVideoAccess } from '$lib/domain/video/videoAccess';
	import { toISODate } from '$lib/domain/scheduling/slotCalendar';
	import { goto } from '$app/navigation';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';
	import FactsCarousel from '$lib/components/facts/FactsCarousel.svelte';
	import ContactPracticeForm from '$lib/components/patient/ContactPracticeForm.svelte';
	import {
		badgeClass,
		firstName,
		formatApptDate,
		formatTime
	} from '$lib/ui/clinicFormat';
	import type { ActionId } from '$lib/domain/appointment/lifecycleEngine';

	let lang = $derived(uiLanguage($preferences.language));
	const PATIENT_ID = DEMO_PATIENT_ID;
	const today = toISODate(new Date());

	let mine = $derived(
		$appointments
			.filter((a) => a.patientId === PATIENT_ID)
			.map((a) => appointmentService.view(a, 'patient'))
	);
	let upcoming = $derived(
		mine
			.filter(
				(a) =>
					(a.status === 'requested' || a.status === 'confirmed') && a.date >= today
			)
			.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
	);
	let helloName = $derived(firstName(mine[0]?.patientName || 'John'));
	let factCards = $derived.by(() => {
		void $appointments;
		void $requirements;
		return factsService.forPatient(PATIENT_ID);
	});
	let factHeading = $derived('Before you book');
	let inbox = $derived(
		$patientNotifications
			.filter(
				(n) =>
					n.patientId === PATIENT_ID &&
					(n.type === 'visit_completed' || n.type === 'visit_cancelled')
			)
			.map((n) => {
				const appt = appointmentService.get(n.appointmentId);
				const doc = appt
					? doctorLine(appt.practiceId, appt.doctorId)
					: { name: 'Your practice', specialty: '', practiceName: '', location: '' };
				return { ...n, appt, doc };
			})
	);
	let unreadInbox = $derived(inbox.filter((n) => !n.readAt));

	function doctorLine(practiceId: string, doctorId?: string) {
		const practice = practiceService.get(practiceId);
		const doctor = doctorId
			? practice?.doctors.find((d) => d.id === doctorId)
			: practice?.doctors[0];
		return {
			name: doctor?.name || practice?.name || 'Doctor',
			specialty: doctor?.specialty || practice?.specialties?.[0] || '',
			practiceName: practice?.name || '',
			location: practice?.location || ''
		};
	}

	async function act(
		id: string,
		action: Extract<ActionId, 'cancel' | 'join_video'>,
		confirmMessage = 'Cancel this appointment? The time slot will open again.'
	) {
		try {
			if (action === 'join_video') {
				goto(`/video?id=${id}&role=patient`);
				return;
			}
			if (!confirm(confirmMessage)) return;
			await appointmentService.applyAction(id, action, 'patient');
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Action failed');
		}
	}

	function acknowledge(id: string) {
		notificationService.markRead(id);
	}
</script>

<div class="welcome-row">
	<div class="avatar">{helloName.slice(0, 1)}</div>
	<div>
		<h1 style="font-size:1.35rem;font-weight:700">{t(lang, greetingKey())}, {helloName}</h1>
		<p class="sub">{t(lang, 'dash.sub')}</p>
		<p class="policy-hint">{fill(lang, 'policy.cancel', { hours: String(CANCEL_MIN_NOTICE_HOURS) })}</p>
	</div>
</div>

{#if upcoming.length === 0 && factCards.length}
	<FactsCarousel cards={factCards} heading={factHeading} />
{/if}

{#if unreadInbox.length}
	<section aria-labelledby="inbox-heading">
		<h2 id="inbox-heading" class="section-title">Requests from your practice</h2>
		<ul class="visit-list">
			{#each unreadInbox as n (n.id)}
				<li class="card visit-card">
					<div class="visit-card__body">
						{#if n.type === 'visit_completed'}
							<div class="visit-card__who">
								<h3>Visit completed</h3>
								<span class={badgeClass('done')}>Completed</span>
							</div>
							<p class="detail">
								{n.doc.name}{n.doc.practiceName ? ` · ${n.doc.practiceName}` : ''} asked you to note
								that your visit is complete.
							</p>
						{:else}
							<div class="visit-card__who">
								<h3>{n.status === 'rejected' ? 'Visit declined' : 'Visit cancelled'}</h3>
								<span class={badgeClass('cancelled')}
									>{n.status === 'rejected' ? 'Declined' : 'Cancelled'}</span
								>
							</div>
							<p class="detail">
								{n.doc.name}{n.doc.practiceName ? ` · ${n.doc.practiceName}` : ''}
								{n.status === 'rejected'
									? 'declined your visit request.'
									: 'cancelled your visit.'}
							</p>
						{/if}
						{#if n.appt}
							<p class="detail">
								{formatApptDate(n.appt.date, uiLocale(lang))} · {formatTime(n.appt.time, uiLocale(lang))}
								· {reasonText(lang, n.appt.reason)}
							</p>
						{/if}
						<div class="visit-card__actions">
							<button class="btn btn-primary btn-sm" type="button" onclick={() => acknowledge(n.id)}
								>Got it</button
							>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section aria-labelledby="upcoming-heading">
	<h2 id="upcoming-heading" class="section-title">{t(lang, 'dash.upcoming')}</h2>
	{#if upcoming.length === 0}
		<div class="empty-state">{t(lang, 'dash.empty')} <a href="/patient/match">{t(lang, 'dash.find')}</a></div>
	{:else}
		<ul class="visit-list">
			{#each upcoming as v (v.id)}
				{@const doc = doctorLine(v.practiceId, v.doctorId)}
				{@const place = resolveVideoAccess({
					practice: practiceService.get(v.practiceId),
					doctor: practiceService.get(v.practiceId)?.doctors.find((d) => d.id === v.doctorId),
					modality: v.modality
				})}
				{@const bookerId = CHANNEL_TO_SYSTEM[practiceService.get(v.practiceId)?.bookingChannel || '']}
				{@const booker = bookerId ? getSystemById(bookerId)?.name : undefined}
				{@const external = Boolean(v.loggedExternally || booker)}
				{@const canJoin =
					place.kind === 'in_app' && v.allowedActions.includes('join_video') && Boolean(v.callStartedAt)}
				<li class="card visit-card">
					<div class="visit-card__when">
						<strong>{formatApptDate(v.date, uiLocale(lang))}</strong>
						<span>{formatTime(v.time, uiLocale(lang))}</span>
					</div>
					<div class="visit-card__body">
						<div class="visit-card__who">
							<h3>{doc.name}</h3>
							<span class={badgeClass(v.badge)}>{statusText(lang, v.status)}</span>
						</div>
						<p class="detail">
							{specialtyText(lang, doc.specialty)} · {doc.practiceName}{doc.location ? ` · ${doc.location}` : ''}
						</p>
						<p class="detail">{reasonText(lang, v.reason)}</p>
						{#if v.status === 'requested'}
							<p class="detail">{t(lang, 'visit.waiting')}</p>
						{:else if place.kind === 'in_app' && !v.callStartedAt}
							<p class="detail">{t(lang, 'dash.doctorStarts')}</p>
						{:else if place.kind === 'external'}
							<p class="detail">{fill(lang, 'dash.videoOn', { system: place.systemName })}</p>
						{/if}
						<div class="visit-card__actions">
							{#if canJoin}
								<button
									class="btn btn-primary btn-sm"
									type="button"
									onclick={() => act(v.id, 'join_video')}>Join video</button
								>
							{/if}
							<ExternalSystemLinks
								compact
								practiceOnly
								practiceId={v.practiceId}
								doctorId={v.doctorId}
								doctorName={doc.name}
							/>
							{#if v.allowedActions.includes('cancel')}
								<button
									class="btn btn-ghost btn-sm"
									type="button"
									onclick={() =>
										act(
											v.id,
											'cancel',
											external
												? fill(lang, 'visit.deleteConfirm', { system: booker || '' })
												: t(lang, 'visit.cancelConfirm')
										)}>{external ? t(lang, 'visit.delete') : t(lang, 'visit.cancel')}</button
								>
							{/if}
							<ContactPracticeForm compact practiceId={v.practiceId} doctorId={v.doctorId} />
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

