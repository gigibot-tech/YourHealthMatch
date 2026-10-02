/**
 * One recommended doctor per symptom. Coverage (you already have someone)
 * wins over a new match. Matching rules stay in the engine.
 */
import type { Appointment } from '$lib/domain/appointment/Appointment';
import { SYMPTOMS, type Symptom } from '$lib/domain/care/symptoms';
import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
import type { MatchResult } from '$lib/domain/matching/matchingEngine';
import { matchingService } from './matchingService';
import { practiceService } from './practiceService';

export type CoveredVisit = {
	doctorName: string;
	practiceName: string;
	date: string;
	time: string;
};

export type SymptomRecommendation = Symptom & {
	covered: CoveredVisit | null;
	match: MatchResult | null;
};

const OPEN: Appointment['status'][] = ['requested', 'confirmed'];

function doctorSpecialty(practiceId: string, doctorId?: string): string {
	const practice = practiceService.get(practiceId);
	const doctor = doctorId
		? practice?.doctors.find((d) => d.id === doctorId)
		: practice?.doctors[0];
	return doctor?.specialty || '';
}

function coveredVisit(
	symptom: Symptom,
	appointments: Appointment[]
): CoveredVisit | null {
	const visit = appointments
		.filter((a) => OPEN.includes(a.status))
		.filter((a) => doctorSpecialty(a.practiceId, a.doctorId) === symptom.specialty)
		.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];
	if (!visit) return null;
	const practice = practiceService.get(visit.practiceId);
	const doctor = practice?.doctors.find((d) => d.id === visit.doctorId);
	return {
		doctorName: doctor?.name || practice?.name || 'Your doctor',
		practiceName: practice?.name || '',
		date: visit.date,
		time: visit.time
	};
}

export function recommendationsForPatient(
	requirements: PatientRequirements,
	appointments: Appointment[]
): SymptomRecommendation[] {
	return SYMPTOMS.map((symptom) => ({
		...symptom,
		covered: coveredVisit(symptom, appointments),
		match: matchingService.findMatches({ ...requirements, specialty: symptom.specialty })[0] ?? null
	}));
}
