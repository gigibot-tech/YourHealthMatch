import { describe, expect, it, beforeEach, vi } from 'vitest';
import { safeMerge } from '$lib/safeMerge';
import { patientRequirementsDefaults } from '$lib/domain/matching/matchDefaults';
import { appointmentRepo } from '$lib/adapters/localRepos';
import {
	createLocalNotificationAdapter,
	createStubNotificationPort,
	localNotificationStore
} from '$lib/adapters/localNotificationAdapter';
import { appointmentService, notificationService } from './services';
import { createNotificationService } from './notificationService';
import { practiceService } from './practiceService';

const reqs = safeMerge(patientRequirementsDefaults, {
	language: 'EN',
	specialty: 'Ophthalmology',
	insurance: 'GKV' as const,
	location: 'Greifswald',
	newPatient: true,
	city: 'Greifswald',
	postcode: '17489',
	modality: 'video' as const
});

function bookDemo(date: string, time: string, reason = 'Follow-up') {
	practiceService.publish({
		practiceId: 'prac_turner',
		doctorId: 'doc_turner',
		date,
		time
	});
	return appointmentService.book({
		requirements: reqs,
		practiceId: 'prac_turner',
		doctorId: 'doc_turner',
		slot: { date, time },
		matchScore: 1,
		reason,
		modality: 'video'
	});
}

describe('visit-completed patient notification', () => {
	const store = createLocalNotificationAdapter('yhm_test_notifications');

	beforeEach(() => {
		appointmentRepo.replaceAll([]);
		store.replaceAll([]);
		localNotificationStore.replaceAll([]);
	});

	it('local adapter is idempotent per appointmentId', async () => {
		const payload = {
			appointmentId: 'appt_1',
			patientId: 'pat_demo',
			status: 'completed' as const,
			completedAt: '2026-10-02T12:00:00.000Z'
		};
		const first = await store.notifyVisitCompleted(payload);
		const second = await store.notifyVisitCompleted({
			...payload,
			completedAt: '2026-10-02T13:00:00.000Z'
		});
		expect(first).toMatchObject({ delivered: true, idempotent: false });
		expect(second).toMatchObject({
			id: first.id,
			delivered: false,
			idempotent: true
		});
		expect(store.listForPatient('pat_demo')).toHaveLength(1);
		const row = store.listForPatient('pat_demo')[0];
		expect(row.type).toBe('visit_completed');
		expect(row.type === 'visit_completed' && row.completedAt).toBe(payload.completedAt);
	});

	it('stub outbound channel is idempotent and does not persist inbox rows', async () => {
		const log = vi.fn();
		const stub = createStubNotificationPort(log);
		const payload = {
			appointmentId: 'appt_stub',
			patientId: 'pat_demo',
			status: 'completed' as const,
			completedAt: '2026-10-02T12:00:00.000Z'
		};
		const first = await stub.notifyVisitCompleted(payload);
		const second = await stub.notifyVisitCompleted(payload);
		expect(first.idempotent).toBe(false);
		expect(second.idempotent).toBe(true);
		expect(log).toHaveBeenCalledOnce();
	});

	it('createNotificationService wraps the port for patient inbox reads', async () => {
		const svc = createNotificationService(store);
		await svc.notifyVisitCompleted({
			appointmentId: 'appt_read',
			patientId: 'pat_demo',
			status: 'completed',
			completedAt: '2026-10-02T12:00:00.000Z'
		});
		expect(svc.unreadForPatient('pat_demo')).toHaveLength(1);
		const marked = svc.markRead(svc.listForPatient('pat_demo')[0].id);
		expect(marked?.readAt).toBeTruthy();
		expect(svc.unreadForPatient('pat_demo')).toHaveLength(0);
	});

	it('doctor complete via applyAction emits a patient notification', async () => {
		const appt = bookDemo('2031-04-15', '15:00');
		await appointmentService.applyAction(appt.id, 'confirm', 'doctor');

		const completed = await appointmentService.applyAction(appt.id, 'complete', 'doctor');
		expect(completed.status).toBe('completed');

		const mine = notificationService
			.listForPatient('pat_demo')
			.filter((n) => n.appointmentId === appt.id);
		expect(mine).toHaveLength(1);
		expect(mine[0]).toMatchObject({
			type: 'visit_completed',
			patientId: 'pat_demo',
			status: 'completed',
			appointmentId: appt.id
		});
		expect(mine[0].type === 'visit_completed' && mine[0].completedAt).toBeTruthy();

		const again = await notificationService.notifyVisitCompleted({
			appointmentId: appt.id,
			patientId: 'pat_demo',
			status: 'completed',
			completedAt: new Date().toISOString()
		});
		expect(again.idempotent).toBe(true);
		expect(
			notificationService.listForPatient('pat_demo').filter((n) => n.appointmentId === appt.id)
		).toHaveLength(1);
	});

	it('non-complete actions do not emit visit-completed notifications', async () => {
		const appt = bookDemo('2031-04-16', '16:00', 'Check');
		await appointmentService.applyAction(appt.id, 'confirm', 'doctor');
		expect(
			notificationService
				.listForPatient('pat_demo')
				.filter((n) => n.appointmentId === appt.id && n.type === 'visit_completed')
		).toHaveLength(0);
	});
});

describe('visit-cancelled patient notification', () => {
	const store = createLocalNotificationAdapter('yhm_test_notifications_cancel');

	beforeEach(() => {
		appointmentRepo.replaceAll([]);
		store.replaceAll([]);
		localNotificationStore.replaceAll([]);
	});

	it('local adapter is idempotent per appointmentId', async () => {
		const payload = {
			appointmentId: 'appt_c1',
			patientId: 'pat_demo',
			status: 'cancelled' as const,
			cancelledAt: '2026-10-02T12:00:00.000Z',
			cancelledBy: 'doctor' as const
		};
		const first = await store.notifyVisitCancelled(payload);
		const second = await store.notifyVisitCancelled({
			...payload,
			cancelledAt: '2026-10-02T13:00:00.000Z',
			status: 'rejected'
		});
		expect(first).toMatchObject({ delivered: true, idempotent: false });
		expect(second).toMatchObject({
			id: first.id,
			delivered: false,
			idempotent: true
		});
		expect(store.listForPatient('pat_demo')).toHaveLength(1);
		const row = store.listForPatient('pat_demo')[0];
		expect(row.type).toBe('visit_cancelled');
		expect(row.type === 'visit_cancelled' && row.cancelledAt).toBe(payload.cancelledAt);
		expect(row.type === 'visit_cancelled' && row.cancelledBy).toBe('doctor');
	});

	it('stub outbound channel is idempotent for cancel', async () => {
		const log = vi.fn();
		const stub = createStubNotificationPort(log);
		const payload = {
			appointmentId: 'appt_stub_c',
			patientId: 'pat_demo',
			status: 'rejected' as const,
			cancelledAt: '2026-10-02T12:00:00.000Z',
			cancelledBy: 'doctor' as const
		};
		const first = await stub.notifyVisitCancelled(payload);
		const second = await stub.notifyVisitCancelled(payload);
		expect(first.idempotent).toBe(false);
		expect(second.idempotent).toBe(true);
		expect(log).toHaveBeenCalledOnce();
	});

	it('doctor reject via applyAction emits declined notification', async () => {
		const appt = bookDemo('2031-05-10', '10:00', 'New request');
		const rejected = await appointmentService.applyAction(appt.id, 'reject', 'doctor');
		expect(rejected.status).toBe('rejected');
		expect(rejected.cancelledBy).toBe('doctor');

		const mine = notificationService
			.listForPatient('pat_demo')
			.filter((n) => n.appointmentId === appt.id);
		expect(mine).toHaveLength(1);
		expect(mine[0]).toMatchObject({
			type: 'visit_cancelled',
			patientId: 'pat_demo',
			status: 'rejected',
			cancelledBy: 'doctor',
			appointmentId: appt.id
		});

		const again = await notificationService.notifyVisitCancelled({
			appointmentId: appt.id,
			patientId: 'pat_demo',
			status: 'rejected',
			cancelledAt: new Date().toISOString(),
			cancelledBy: 'doctor'
		});
		expect(again.idempotent).toBe(true);
		expect(
			notificationService.listForPatient('pat_demo').filter((n) => n.appointmentId === appt.id)
		).toHaveLength(1);
	});

	it('doctor cancel via applyAction emits cancelled notification with cancelledBy doctor', async () => {
		const appt = bookDemo('2031-05-11', '11:00');
		const cancelled = await appointmentService.applyAction(appt.id, 'cancel', 'doctor');
		expect(cancelled.status).toBe('cancelled');
		expect(cancelled.cancelledBy).toBe('doctor');

		const mine = notificationService
			.listForPatient('pat_demo')
			.filter((n) => n.appointmentId === appt.id && n.type === 'visit_cancelled');
		expect(mine).toHaveLength(1);
		expect(mine[0]).toMatchObject({
			type: 'visit_cancelled',
			status: 'cancelled',
			cancelledBy: 'doctor'
		});
	});

	it('patient cancel does not emit a practice-inbox notification', async () => {
		const appt = bookDemo('2031-05-12', '12:00');
		const cancelled = await appointmentService.applyAction(appt.id, 'cancel', 'patient');
		expect(cancelled.status).toBe('cancelled');
		expect(cancelled.cancelledBy).toBe('patient');
		expect(
			notificationService.listForPatient('pat_demo').filter((n) => n.appointmentId === appt.id)
		).toHaveLength(0);
	});
});
