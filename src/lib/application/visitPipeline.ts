/**
 * Visit stage after a symptom match: draft → hold → book / log → save Stamm doctor.
 */
import type { Appointment } from '$lib/domain/appointment/Appointment';
import { upsertAssignedDoctor } from '$lib/domain/matching/assignedDoctors';
import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
import type { MatchResult } from '$lib/domain/matching/matchingEngine';
import type { Slot } from '$lib/domain/scheduling/slotCalendar';
import { modalityForVisit, resolveVideoAccess } from '$lib/domain/video/videoAccess';
import { patientRepo } from '$lib/adapters/localRepos';
import { appointmentService, type BookingDraft } from './appointmentService';
import { practiceService } from './practiceService';

export type MatchVisitSelection = {
	patient: PatientRequirements;
	match: MatchResult;
	/** Human reason / specialty label stored on the visit. */
	reason: string;
	symptomId?: string;
	modality: BookingDraft['modality'];
};

export type VisitDraft = Omit<BookingDraft, 'slot'> & { slot?: Slot; symptomId?: string };

function rememberDoctor(specialty: string, practiceId: string, doctorId: string) {
	const current = patientRepo.get();
	patientRepo.save({
		assignedDoctors: upsertAssignedDoctor(current.assignedDoctors ?? [], {
			specialty,
			practiceId,
			doctorId
		})
	});
}

/** Local .ics text for the booked visit — not a calendar API. */
export function visitIcs(appt: Appointment, practiceName = ''): string {
	const stamp = (date: string, time: string) =>
		`${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
	const uid = `${appt.id}@yourhealthmatch.local`;
	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//YourHealthMatch//EN',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${stamp(appt.date, appt.time)}`,
		`DTSTART:${stamp(appt.date, appt.time)}`,
		`SUMMARY:${appt.reason}`,
		`DESCRIPTION:${practiceName} · ${appt.modality}`,
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');
}

export const visitPipeline = {
	draftFromMatch(sel: MatchVisitSelection): VisitDraft {
		const practice = practiceService.get(sel.match.practiceId);
		const doctor = practice?.doctors.find((d) => d.id === sel.match.doctorId);
		const access = resolveVideoAccess({
			practice,
			doctor,
			modality: sel.modality === 'in_person' ? 'in_person' : 'video'
		});
		return {
			requirements: {
				...sel.patient,
				specialty: doctor?.specialty || sel.patient.specialty || sel.reason
			},
			practiceId: sel.match.practiceId,
			doctorId: sel.match.doctorId,
			matchScore: sel.match.score,
			reason: sel.reason,
			modality: modalityForVisit(sel.modality, access),
			symptomId: sel.symptomId
		};
	},

	withSlot(draft: VisitDraft, slot: Slot, holderId = patientRepo.activeId()): BookingDraft {
		if (!draft.practiceId || !draft.doctorId || !draft.requirements) {
			throw new Error('Pick a match before choosing a slot');
		}
		practiceService.holdSlot({
			practiceId: draft.practiceId,
			doctorId: draft.doctorId,
			date: slot.date,
			time: slot.time,
			holderId
		});
		return {
			requirements: draft.requirements,
			practiceId: draft.practiceId,
			doctorId: draft.doctorId,
			slot,
			matchScore: draft.matchScore ?? 0,
			reason: draft.reason || 'Consultation',
			modality: draft.modality || 'video'
		};
	},

	book(
		draft: BookingDraft,
		patientId = patientRepo.activeId(),
		patientName = 'Patient'
	): Appointment {
		const appt = appointmentService.book(draft, patientId, patientName);
		practiceService.releaseHold({
			practiceId: draft.practiceId,
			doctorId: draft.doctorId!,
			date: draft.slot.date,
			time: draft.slot.time,
			holderId: patientId
		});
		const specialty =
			draft.requirements.specialty ||
			practiceService.get(draft.practiceId)?.doctors.find((d) => d.id === draft.doctorId)
				?.specialty ||
			'';
		if (specialty && draft.doctorId) {
			rememberDoctor(specialty, draft.practiceId, draft.doctorId);
		}
		return appt;
	},

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
		const appt = appointmentService.logExternal(input);
		const specialty =
			input.requirements?.specialty ||
			practiceService.get(input.practiceId)?.doctors.find((d) => d.id === input.doctorId)
				?.specialty ||
			'';
		if (specialty) rememberDoctor(specialty, input.practiceId, input.doctorId);
		return appt;
	},

	downloadIcs(appt: Appointment) {
		const practice = practiceService.get(appt.practiceId);
		const blob = new Blob([visitIcs(appt, practice?.name || '')], {
			type: 'text/calendar;charset=utf-8'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${appt.id}.ics`;
		a.click();
		URL.revokeObjectURL(url);
	}
};
