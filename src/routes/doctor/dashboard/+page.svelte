<script lang="ts">
	import { appointmentService, practiceService } from '$lib/application/services';
	import { appointments, role } from '$lib/stores/app';
	import { goto } from '$app/navigation';
	import { toISODate } from '$lib/domain/scheduling/slotCalendar';
	import {
		badgeClass,
		cancelPolicyHint,
		firstName,
		formatTime,
		greeting
	} from '$lib/ui/clinicFormat';
	import type { ActionId } from '$lib/domain/appointment/lifecycleEngine';

	$effect(() => {
		if ($role !== 'doctor') role.set('doctor');
	});

	const practiceId = 'prac_turner';
	const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
	const today = toISODate(new Date());
	const todayLabel = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});

	let doctorName = $derived(
		practiceService.get(practiceId)?.doctors.find((d) => d.id === 'doc_turner')?.name ||
			'Dr. Olivia Turner'
	);

	let todays = $derived(
		$appointments
			.filter(
				(a) =>
					a.practiceId === practiceId &&
					a.date === today &&
					a.status !== 'cancelled' &&
					a.status !== 'rejected'
			)
			.map((a) => appointmentService.view(a, 'doctor'))
			.sort((a, b) => a.time.localeCompare(b.time))
	);
	let pending = $derived(
		$appointments
			.filter((a) => a.practiceId === practiceId && a.status === 'requested')
			.map((a) => appointmentService.view(a, 'doctor'))
	);
	let completedToday = $derived(todays.filter((a) => a.status === 'completed'));
	let next = $derived(todays.find((a) => a.status === 'confirmed') || todays[0] || null);
	let byHour = $derived.by(() => {
		const map: Record<string, typeof todays> = {};
		for (const a of todays) {
			const h = `${a.time.slice(0, 2)}:00`;
			(map[h] ??= []).push(a);
		}
		return map;
	});

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
		<h1>{greeting()}, {firstName(doctorName.replace(', M.D.', ''))}</h1>
		<p class="sub">{todayLabel} · Today’s clinic</p>
		<p class="policy-hint">{cancelPolicyHint()}</p>
	</div>
</div>

<div class="kpi-row">
	<div class="kpi-card">
		<div class="kpi-icon blue">🗓️</div>
		<div><div class="label">Today’s visits</div><div class="value">{todays.length}</div></div>
	</div>
	<div class="kpi-card">
		<div class="kpi-icon orange">⏳</div>
		<div><div class="label">Pending</div><div class="value">{pending.length}</div></div>
	</div>
	<div class="kpi-card">
		<div class="kpi-icon green">✅</div>
		<div><div class="label">Completed</div><div class="value">{completedToday.length}</div></div>
	</div>
	<div class="kpi-card">
		<div class="kpi-icon purple">⏰</div>
		<div>
			<div class="label">Next start</div>
			<div class="value" style="font-size:1.1rem">{next ? formatTime(next.time) : '—'}</div>
		</div>
	</div>
</div>

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
		<h2>No visits scheduled today</h2>
	</div>
{/if}

<div class="doctor-layout">
	<div class="timeline">
		<h2 class="section-title">Today’s timeline</h2>
		{#each HOURS as h}
			<div class="timeline-row">
				<div class="timeline-hour">{formatTime(h)}</div>
				<div class="timeline-slot">
					{#each byHour[h] || [] as a}
						<button
							type="button"
							class="timeline-chip"
							class:pending={a.status === 'requested'}
							onclick={() => timelineClick(a.id, a.status)}
						>
							<strong>{a.patientName}</strong>
							{a.reason} · {formatTime(a.time)}
						</button>
					{/each}
				</div>
			</div>
		{/each}
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
