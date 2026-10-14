/**
 * Recommendations per symptom. Coverage or a saved Stamm doctor wins over a new match.
 * Loads clinic supply (with patient time bands) and returns up to five doctors.
 */
import type { Appointment } from '$lib/domain/appointment/Appointment';
import { SYMPTOMS, type Symptom } from '$lib/domain/care/symptoms';
import { assignedForSpecialty } from '$lib/domain/matching/assignedDoctors';
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
	/** Saved doctor for this specialty when they still pass the rules. */
	assigned: MatchResult | null;
	matches: MatchResult[];
	/** First shown doctor: assigned if still matching, else first of matches. */
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
	const supply = practiceService.clinicSupply(28, requirements.preferredWindow);
	return SYMPTOMS.map((symptom) => {
		const patient = {
			...requirements,
			specialty: symptom.specialty,
			modality:
				requirements.modality === 'either'
					? symptom.defaultModality
					: requirements.modality
		};
		const found = matchingService.findMatches({ patient, supply });
		const saved = assignedForSpecialty(requirements.assignedDoctors ?? [], symptom.specialty);
		const assigned =
			(saved &&
				found.find(
					(m) => m.practiceId === saved.practiceId && m.doctorId === saved.doctorId
				)) ||
			null;
		const matches = assigned
			? [assigned, ...found.filter((m) => m.doctorId !== assigned.doctorId)]
			: found;
		const match = assigned ?? matches[0] ?? null;
		return {
			...symptom,
			covered: coveredVisit(symptom, appointments),
			assigned,
			matches,
			match
		};
	});
}
