<script lang="ts">
	import { appointmentService, availabilityService, practiceService } from '$lib/application/services';
	import { appointments, availability } from '$lib/stores/app';
	import { dateStrip } from '$lib/domain/scheduling/slotCalendar';
	import { goto } from '$app/navigation';
	import ExternalSystemLinks from '$lib/components/external/ExternalSystemLinks.svelte';
	import { formatTime } from '$lib/ui/clinicFormat';

	const practiceId = 'prac_turner';
	const practice = $derived(practiceService.get(practiceId));
	const strip = dateStrip(7);
	let selectedDate = $state(strip[0]?.iso ?? '');
	let doctorId = $state('doc_turner');
	let newTime = $state('10:00');
	let notice = $state('');

	let doctors = $derived(practice?.doctors ?? []);

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

<div class="page-header">
	<div>
		<h1>Schedule</h1>
		<p class="sub">You open times. Patients can only book what you publish.</p>
	</div>
</div>

<div class="field-row" style="max-width: 28rem; margin-bottom: 1rem">
	<div class="field">
		<label for="doc">Doctor</label>
		<select id="doc" bind:value={doctorId}>
			{#each doctors as d}
				<option value={d.id}>{d.name}</option>
			{/each}
		</select>
	</div>
</div>

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

<div class="card">
	<h3>Open times</h3>
	<p class="detail">Weekly hours are a template — they are not bookable until you publish them.</p>
	{#if notice}<p class="detail">{notice}</p>{/if}
	<div class="slot-grid" style="margin: 0.75rem 0">
		{#each offers as offer}
			<button
				type="button"
				class="slot-btn"
				disabled={!bookable.has(offer.id)}
				onclick={() => closeOffer(offer.id)}
				title={bookable.has(offer.id) ? 'Click to close this time' : 'Booked — cancel the visit to close'}
			>
				{formatTime(offer.time)}{bookable.has(offer.id) ? '' : ' · booked'}
			</button>
		{/each}
	</div>
	{#if offers.length === 0}
		<p class="empty-state">No times opened this day.</p>
	{/if}
	<div class="actions">
		<label class="field" style="margin: 0">
			<span class="sr-only">New time</span>
			<input type="time" step="1800" bind:value={newTime} />
		</label>
		<button class="btn btn-primary btn-sm" type="button" onclick={offerTime}>Open this time</button>
		<button class="btn btn-ghost btn-sm" type="button" onclick={offerFromHours}
			>Open from weekly hours</button
		>
	</div>
</div>

<h2 class="section-title" style="margin-top:1.75rem">Bookings</h2>
{#if list.length === 0}
	<div class="empty-state">No appointments this day.</div>
{:else}
	{#each list as v}
		<div class="card appt-card">
			<div class="meta">
				<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
					<h3>{v.patientName}</h3>
					<span class="badge {v.badge}">{v.label}</span>
				</div>
				<div class="detail">{v.time} · {v.reason}</div>
			</div>
			<div class="appt-actions">
				{#each v.allowedActions as action}
					{#if action === 'confirm'}
						<button class="btn btn-primary btn-sm" type="button" onclick={() => act(v.id, 'confirm')}
							>Confirm</button
						>
					{:else if action === 'complete'}
						<button class="btn btn-sm" type="button" onclick={() => act(v.id, 'complete')}
							>Complete</button
						>
					{:else if action === 'join_video'}
						<button class="btn btn-primary btn-sm" type="button" onclick={() => act(v.id, 'join_video')}
							>Join video</button
						>
					{/if}
				{/each}
			</div>
			<ExternalSystemLinks compact practiceId={v.practiceId} doctorId={v.doctorId} />
		</div>
	{/each}
{/if}
