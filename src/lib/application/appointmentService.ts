import { safeMerge } from '$lib/safeMerge';
import {
	allowedActions,
	appointmentLifecycle,
	transition,
	type ActionId,
	type Role
} from '$lib/domain/appointment/lifecycleEngine';
import { channelFor, type Appointment } from '$lib/domain/appointment/Appointment';
import { hasClash, toISODate, type Slot } from '$lib/domain/scheduling/slotCalendar';
import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
import { appointmentRepo, practiceRepo } from '$lib/adapters/localRepos';
import { toSlot } from '$lib/domain/scheduling/availability';
import { resolveVideoAccess } from '$lib/domain/video/videoAccess';
import { practiceService } from './practiceService';
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
		const doctorId = draft.doctorId;
		if (!doctorId) throw new Error('Pick a doctor before booking');
		const offered = practiceService
			.listBookable({
				practiceId: draft.practiceId,
				doctorId,
				fromDate: draft.slot.date,
				days: 1,
				holderId: patientId
			})
			.some((offer) => offer.time === draft.slot.time);
		if (!offered) throw new Error('This doctor has not opened that time');
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
				...(action === 'cancel' || action === 'reject'
					? { cancelledAt: new Date(now).toISOString(), cancelledBy: actor }
					: {})
			})
		);
		await runTransitionHooks(action, saved);
		return saved;
	},

	/** Doctor opens the room. The patient cannot join before this. */
	startCall(id: string, now = new Date().toISOString()): Appointment {
		const appt = appointmentRepo.get(id);
		if (!appt) throw new Error('Appointment not found');
		if (appt.status !== 'confirmed') throw new Error('Confirm the visit before starting video');
		if (appt.modality === 'in_person') throw new Error('This visit is in person');
		const practice = practiceRepo.get(appt.practiceId);
		const doctor = practice?.doctors.find((d) => d.id === appt.doctorId);
		const access = resolveVideoAccess({ practice, doctor, modality: appt.modality });
		if (access.kind === 'external') {
			throw new Error(`This video visit opens on ${access.systemName}`);
		}
		if (access.kind !== 'in_app') throw new Error('This doctor is not enabled for video here');
		if (appt.callStartedAt) return appt;
		return appointmentRepo.save({ ...appt, callStartedAt: now });
	},

	/**
	 * Patient already booked on the practice’s app (Doctolib, …) and records it here.
	 * Does not take a slot from this calendar.
	 */
	logExternal(input: {
		practiceId: string;
		doctorId: string;
		date: string;
		time: string;
		reason: string;
		modality: Appointment['modality'];
		requirements?: PatientRequirements;
		patientId?: string;
		patientName?: string;
	}): Appointment {
		const practice = practiceRepo.get(input.practiceId);
		if (!practice) throw new Error('Practice not found');
		if (!practice.doctors.some((d) => d.id === input.doctorId)) {
			throw new Error('Doctor not found');
		}
		if (!input.date || !input.time) throw new Error('Date and time are required');
		const id = `appt_${Date.now()}`;
		const appt: Appointment = {
			id,
			practiceId: input.practiceId,
			doctorId: input.doctorId,
			patientId: input.patientId ?? 'pat_demo',
			patientName: input.patientName ?? 'Patient',
			reason: input.reason.trim() || 'Consultation',
			date: input.date,
			time: input.time,
			status: 'confirmed',
			modality: input.modality === 'either' ? 'in_person' : input.modality,
			channel: channelFor(id),
			requirements: input.requirements,
			loggedExternally: true
		};
		return appointmentRepo.save(appt);
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

	openSlotsForPractice(
		practiceId: string,
		fromDate = toISODate(new Date()),
		days = 7,
		doctorId?: string
	) {
		return practiceService
			.listBookable({ practiceId, doctorId, fromDate, days })
			.map(toSlot);
	}
};
