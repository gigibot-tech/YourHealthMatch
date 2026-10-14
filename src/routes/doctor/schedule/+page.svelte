<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		DEMO_DOCTOR_ID,
		DEMO_PRACTICE_ID,
		practiceService
	} from '$lib/application/services';
	import WeekBook, { type BookCell } from '$lib/components/scheduling/WeekBook.svelte';
	import { toISODate } from '$lib/domain/scheduling/slotCalendar';
	import { t, uiLanguage } from '$lib/i18n';
	import { appointments, availability, preferences } from '$lib/stores/app';

	const DAY_HEAD = ['MO', 'DI', 'MI', 'DO', 'FR'] as const;
	const practiceId = DEMO_PRACTICE_ID;
	const today = toISODate(new Date());

	let lang = $derived(uiLanguage($preferences.language));
	const practice = $derived(practiceService.get(practiceId));
	let doctorId = $state(DEMO_DOCTOR_ID);
	let weekMonday = $state(mondayOf(today));
	let notice = $state('');

	let doctors = $derived(practice?.doctors ?? []);

	const times = bookTimes();

	let days = $derived(
		DAY_HEAD.map((head, i) => {
			const iso = addDays(weekMonday, i);
			const [, m, d] = iso.split('-');
			return { iso, head: `${head} ${Number(d)}.${Number(m)}.` };
		})
	);

	let weekLabel = $derived(`${days[0]?.head.slice(3)} – ${days[4]?.head.slice(3)}`);

	let lookup = $derived.by(() => {
		$availability;
		$appointments;
		const from = days[0]?.iso ?? weekMonday;
		const to = days[4]?.iso ?? weekMonday;
		const offers = practiceService.openTimes({ practiceId, doctorId, fromDate: from, toDate: to });
		const map = new Map<string, BookCell>();
		for (const offer of offers) {
			map.set(`${offer.date}|${offer.time}`, {
				offerId: offer.id,
				appointmentId: null,
				patientName: null
			});
		}
		for (const appt of $appointments) {
			if (appt.practiceId !== practiceId || appt.doctorId !== doctorId) continue;
			if (appt.status === 'cancelled' || appt.status === 'rejected') continue;
			if (appt.date < from || appt.date > to) continue;
			const key = `${appt.date}|${appt.time}`;
			const prev = map.get(key);
			map.set(key, {
				offerId: prev?.offerId ?? null,
				appointmentId: appt.id,
				patientName: appt.patientName
			});
		}
		return map;
	});

	function cellAt(date: string, time: string): BookCell {
		return (
			lookup.get(`${date}|${time}`) ?? {
				offerId: null,
				appointmentId: null,
				patientName: null
			}
		);
	}

	function flash(message: string) {
		notice = message;
	}

	function shiftWeek(delta: number) {
		weekMonday = addDays(weekMonday, delta * 7);
		notice = '';
	}

	function onCell(date: string, time: string, cell: BookCell) {
		if (cell.appointmentId) {
			goto(`/doctor/appointment/${cell.appointmentId}`);
			return;
		}
		if (cell.offerId) {
			try {
				practiceService.close(cell.offerId);
				flash('Time closed');
			} catch (e) {
				flash(e instanceof Error ? e.message : 'Could not close time');
			}
			return;
		}
		try {
			practiceService.publish({ practiceId, doctorId, date, time });
			flash(`Opened ${time}`);
		} catch (e) {
			flash(e instanceof Error ? e.message : 'Could not open time');
		}
	}

	function fillWeek() {
		if (!practice) return;
		try {
			let count = 0;
			for (const day of days) {
				count += practiceService.publishFromWeeklyHours(practice, doctorId, day.iso).length;
			}
			flash(`Opened ${count} times from weekly hours`);
		} catch (e) {
			flash(e instanceof Error ? e.message : 'Could not publish hours');
		}
	}

	function mondayOf(iso: string) {
		const date = new Date(`${iso}T12:00:00`);
		const day = date.getDay();
		const diff = day === 0 ? -6 : 1 - day;
		date.setDate(date.getDate() + diff);
		return toISODate(date);
	}

	function addDays(iso: string, n: number) {
		const date = new Date(`${iso}T12:00:00`);
		date.setDate(date.getDate() + n);
		return toISODate(date);
	}

	function bookTimes() {
		const out: string[] = [];
		for (let mins = 8 * 60; mins < 18 * 60; mins += 30) {
			const h = String(Math.floor(mins / 60)).padStart(2, '0');
			const m = String(mins % 60).padStart(2, '0');
			out.push(`${h}:${m}`);
		}
		return out;
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

	<div class="week-book-bar">
		<button class="btn btn-ghost btn-sm" type="button" onclick={() => shiftWeek(-1)}>
			{t(lang, 'schedule.prevWeek')}
		</button>
		<strong class="week-book-bar__label">{weekLabel}</strong>
		<button class="btn btn-ghost btn-sm" type="button" onclick={() => shiftWeek(1)}>
			{t(lang, 'schedule.nextWeek')}
		</button>
		<button class="btn btn-primary btn-sm" type="button" onclick={fillWeek}>
			{t(lang, 'schedule.fillWeek')}
		</button>
	</div>

	{#if notice}<p class="detail schedule-notice">{notice}</p>{/if}
	<p class="detail week-book-legend">{t(lang, 'schedule.legend')}</p>

	<WeekBook {days} {times} {cellAt} {today} {onCell} />

	<p class="schedule-queue-link">
		<a href="/doctor/dashboard">{t(lang, 'schedule.toQueue')}</a>
	</p>
</div>
