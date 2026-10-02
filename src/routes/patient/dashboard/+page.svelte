<script lang="ts">
	import {
		appointmentService,
		DEMO_PATIENT_ID,
		factsService,
		practiceService
	} from '$lib/application/services';
	import { appointments, requirements, preferences } from '$lib/stores/app';
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

<section aria-labelledby="upcoming-heading">
	<h2 id="upcoming-heading" class="section-title">{t(lang, 'dash.upcoming')}</h2>
	{#if upcoming.length === 0}
		<div class="empty-state">{t(lang, 'dash.empty')} <a href="/patient/match">{t(lang, 'dash.find')}</a></div>
	{:else}
		<ul class="visit-list">
			{#each upcoming as v (v.id)}
				{@const doc = doctorLine(v.practiceId, v.doctorId)}
				{@const bookerId = CHANNEL_TO_SYSTEM[practiceService.get(v.practiceId)?.bookingChannel || '']}
				{@const booker = bookerId ? getSystemById(bookerId)?.name : undefined}
				{@const external = Boolean(v.loggedExternally || booker)}
				{@const canJoin = v.allowedActions.includes('join_video') && Boolean(v.callStartedAt)}
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
						{:else if v.modality !== 'in_person' && !v.callStartedAt}
							<p class="detail">{t(lang, 'dash.doctorStarts')}</p>
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

