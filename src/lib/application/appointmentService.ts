import { safeMerge } from '$lib/safeMerge';
import {
	allowedActions,
	appointmentLifecycle,
	transition,
	type ActionId,
	type Role
} from '$lib/domain/appointment/lifecycleEngine';
import { channelFor, type Appointment } from '$lib/domain/appointment/Appointment';
import {
	hasClash,
	openSlots,
	toISODate,
	type Slot
} from '$lib/domain/scheduling/slotCalendar';
import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
import { appointmentRepo, practiceRepo } from '$lib/adapters/localRepos';
import { runTransitionHooks } from './transitionHooks';

export type BookingDraft = {
	requirements: PatientRequirements;
	practiceId: string;
	doctorId?: string;
	slot: Slot;
	matchScore: number;
	reason: string;
	modality: 'in_person' | 'video' | 'either';
};

function bookedSlots(practiceId: string): Slot[] {
	return appointmentRepo
		.getAll()
		.filter((a) => a.practiceId === practiceId && a.status !== 'cancelled' && a.status !== 'rejected')
		.map((a) => ({ date: a.date, time: a.time }));
}

export const appointmentService = {
	book(draft: BookingDraft, patientId = 'pat_demo', patientName = 'Patient'): Appointment {
		const practice = practiceRepo.get(draft.practiceId);
		if (!practice) throw new Error('Practice not found');
		if (hasClash(draft.slot, bookedSlots(draft.practiceId))) {
			throw new Error('That slot is already booked');
		}
		const id = `appt_${Date.now()}`;
		const appt: Appointment = {
			id,
			practiceId: draft.practiceId,
			doctorId: draft.doctorId,
			patientId,
			patientName,
			reason: draft.reason || 'Consultation',
			date: draft.slot.date,
			time: draft.slot.time,
			status: 'requested',
			modality: draft.modality || 'video',
			channel: channelFor(id),
			requirements: draft.requirements
		};
		return appointmentRepo.save(appt);
	},

	async applyAction(id: string, action: ActionId, actor: Role, now = Date.now()) {
		const appt = appointmentRepo.get(id);
		if (!appt) throw new Error('Appointment not found');
		const result = transition(appt.status, action, { actor, now, appointment: appt });
		if (!result.ok) throw new Error(result.error.message);
		if (action === 'join_video') return appt;
		const saved = appointmentRepo.save(
			safeMerge(appt, {
				status: result.value,
				...(action === 'cancel'
					? { cancelledAt: new Date(now).toISOString(), cancelledBy: actor }
					: {})
			})
		);
		await runTransitionHooks(action, saved);
		return saved;
	},

	get(id: string) {
		return appointmentRepo.get(id);
	},

	listForPatient(patientId = 'pat_demo') {
		return appointmentRepo.getAll().filter((a) => a.patientId === patientId);
	},

	listForPractice(practiceId: string) {
		return appointmentRepo.getAll().filter((a) => a.practiceId === practiceId);
	},

	view(appt: Appointment, actor: Role, now = Date.now()) {
		const meta = appointmentLifecycle.states[appt.status];
		return {
			...appt,
			label: meta.label,
			badge: meta.badge,
			allowedActions: allowedActions(appt, actor, now)
		};
	},

	openSlotsForPractice(practiceId: string, fromDate = toISODate(new Date()), days = 7) {
		const p = practiceRepo.get(practiceId);
		if (!p) return [];
		return openSlots({
			weeklyHours: p.weeklyHours,
			explicitSlots: p.availabilitySlots,
			booked: bookedSlots(practiceId),
			fromDate,
			days
		});
	}
};
