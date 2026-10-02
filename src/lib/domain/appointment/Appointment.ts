import type { AppointmentStatus } from './lifecycleEngine';
import type { PatientRequirements } from '../matching/matchDefaults';

/** Appointment entity — owned by scheduling/appointment context. */
export type Appointment = {
	id: string;
	practiceId: string;
	doctorId?: string;
	patientId: string;
	patientName: string;
	reason: string;
	date: string;
	time: string;
	status: AppointmentStatus;
	modality: 'in_person' | 'video' | 'either';
	channel: string;
	/** Set when the doctor opens the video room. Patients join only after this. */
	callStartedAt?: string;
	/** Patient recorded a visit that was booked in another app (Doctolib, …). */
	loggedExternally?: boolean;
	requirements?: PatientRequirements;
	cancelledAt?: string;
	cancelledBy?: string;
};

export function channelFor(id: string): string {
	return `appt_${id}`;
}
