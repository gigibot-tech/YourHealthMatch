<script lang="ts">
	import { appointmentService, availabilityService, practiceService } from '$lib/application/services';
	import { appointments, availability, preferences } from '$lib/stores/app';
	import { t, uiLanguage } from '$lib/i18n';
	import { formatDayLabel, toISODate } from '$lib/domain/scheduling/slotCalendar';
	import { goto } from '$app/navigation';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';
	import MonthCalendar from '$lib/components/scheduling/MonthCalendar.svelte';
	import { formatTime } from '$lib/ui/clinicFormat';

	let lang = $derived(uiLanguage($preferences.language));
	const practiceId = 'prac_turner';
	const practice = $derived(practiceService.get(practiceId));
	let selectedDate = $state(toISODate(new Date()));
	let doctorId = $state('doc_turner');
	let newTime = $state('10:00');
	let notice = $state('');

	let doctors = $derived(practice?.doctors ?? []);
	let dayLabel = $derived(formatDayLabel(selectedDate));

	let offers = $derived.by(() => {
		$availability;
		return availabilityService.listPublished({
			practiceId,
			doctorId,
			fromDate: selectedDate,
			toDate: selectedDate
		});
	});

	let bookable = $derived.by(() => {
		$availability;
		$appointments;
		return new Set(
			availabilityService
				.listBookable({ practiceId, doctorId, fromDate: selectedDate, days: 1 })
				.map((o) => o.id)
		);
	});

	let list = $derived(
		$appointments
			.filter(
				(a) =>
					a.practiceId === practiceId &&
					a.date === selectedDate &&
					a.status !== 'cancelled' &&
					a.status !== 'rejected'
			)
			.map((a) => appointmentService.view(a, 'doctor'))
			.sort((a, b) => a.time.localeCompare(b.time))
	);

	function flash(message: string) {
		notice = message;
	}

	function offerTime() {
		try {
			availabilityService.publish({ practiceId, doctorId, date: selectedDate, time: newTime });
			flash(`Opened ${newTime}`);
		} catch (e) {
			flash(e instanceof Error ? e.message : 'Could not open time');
		}
	}

	function offerFromHours() {
		if (!practice) return;
		try {
			const published = availabilityService.publishFromWeeklyHours(practice, doctorId, selectedDate);
			flash(`Opened ${published.length} times from weekly hours`);
		} catch (e) {
			flash(e instanceof Error ? e.message : 'Could not publish hours');
		}
	}

	function closeOffer(id: string) {
		try {
			availabilityService.unpublish(id);
			flash('Time closed');
		} catch (e) {
			flash(e instanceof Error ? e.message : 'Could not close time');
		}
	}

	async function act(id: string, action: 'confirm' | 'complete' | 'join_video') {
		try {
			if (action === 'join_video') {
				goto(`/video?id=${id}&role=doctor`);
				return;
			}
			await appointmentService.applyAction(id, action, 'doctor');
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Failed');
		}
	}
</script>

<div class="schedule-page">
	<div class="page-header schedule-header">
		<div>
		<h1>{t(lang, 'schedule.title')}</h1>
		<p class="sub">{t(lang, 'schedule.sub')}</p>
		</div>
		<div class="field schedule-doctor">
			<label for="doc">{t(lang, 'schedule.doctor')}</label>
			<select id="doc" bind:value={doctorId}>
				{#each doctors as d}
					<option value={d.id}>{d.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="schedule-workspace">
		<aside class="schedule-cal" aria-label="Pick a day">
			<MonthCalendar bind:value={selectedDate} />
		</aside>

		<div class="schedule-col">
			<section class="card schedule-open">
				<header class="schedule-open__head">
					<h2>{t(lang, 'schedule.open')}</h2>
					<p class="detail">{dayLabel}</p>
				</header>
				<p class="detail schedule-open__hint">
					Weekly hours are a template — publish them before patients can book.
				</p>

				{#if notice}<p class="detail schedule-notice">{notice}</p>{/if}

				{#if offers.length === 0}
					<p class="schedule-muted">No times opened this day.</p>
				{:else}
					<div class="slot-grid">
						{#each offers as offer}
							<button
								type="button"
								class="slot-btn"
								disabled={!bookable.has(offer.id)}
								onclick={() => closeOffer(offer.id)}
								title={bookable.has(offer.id)
									? 'Click to close this time'
									: 'Booked — cancel the visit to close'}
							>
								{formatTime(offer.time)}{bookable.has(offer.id) ? '' : ' · booked'}
							</button>
						{/each}
					</div>
				{/if}

				<div class="schedule-publish">
					<label class="field schedule-publish__time">
						<span class="sr-only">New time</span>
						<input type="time" step="1800" bind:value={newTime} />
					</label>
					<button class="btn btn-primary btn-sm" type="button" onclick={offerTime}
						>Open this time</button
					>
					<button class="btn btn-ghost btn-sm" type="button" onclick={offerFromHours}
						>Open from weekly hours</button
					>
				</div>
			</section>

			<section class="schedule-bookings" aria-labelledby="bookings-heading">
				<h2 id="bookings-heading" class="section-title">{t(lang, 'schedule.bookings')}</h2>
				{#if list.length === 0}
					<div class="card schedule-muted">No appointments this day.</div>
				{:else}
					<ul class="schedule-booking-list">
						{#each list as v}
							<li class="card schedule-booking">
								<div class="schedule-booking__time">{formatTime(v.time)}</div>
								<div class="schedule-booking__body">
									<div class="schedule-booking__who">
										<strong>{v.patientName}</strong>
										<span class="badge {v.badge}">{v.label}</span>
									</div>
									<p class="detail">{v.reason}</p>
									<ExternalSystemLinks compact practiceId={v.practiceId} doctorId={v.doctorId} />
								</div>
								<div class="appt-actions">
									{#each v.allowedActions as action}
										{#if action === 'confirm'}
											<button
												class="btn btn-primary btn-sm"
												type="button"
												onclick={() => act(v.id, 'confirm')}>Confirm</button
											>
										{:else if action === 'complete'}
											<button class="btn btn-sm" type="button" onclick={() => act(v.id, 'complete')}
												>Complete</button
											>
										{:else if action === 'join_video'}
											<button
												class="btn btn-primary btn-sm"
												type="button"
												onclick={() => act(v.id, 'join_video')}
												>{v.callStartedAt ? 'Rejoin' : 'Start visit'}</button
											>
											>
										{/if}
									{/each}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>
	</div>
</div>
