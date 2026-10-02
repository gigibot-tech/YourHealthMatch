import {
	practiceProfileDefaults,
	type Practice
} from '../practice/practiceProfileDefaults';

export { practiceProfileDefaults };
export type { Practice };

/** GKV / PKV / Selbstzahler. Legacy `private` still accepted when reading stored data. */
export type InsuranceType = 'GKV' | 'PKV' | 'self_pay' | 'private' | '';

/** Patient demand fields — same SSOT as matching inputs (survey parity). */
export type PatientRequirements = {
	/** Prefer Phase-1 codes: UK, AR, TR, RU, EN, DE (labels still normalize). */
	language: string;
	specialty: string;
	insurance: InsuranceType;
	location: string;
	newPatient: boolean | null;
	preferredWindow: string;
	modality: 'in_person' | 'video' | 'either';
	postcode: string;
	krankenkasse: string;
	city: string;
};

export const patientRequirementsDefaults: PatientRequirements = {
	language: '',
	specialty: '',
	insurance: '',
	location: '',
	newPatient: null,
	preferredWindow: '',
	modality: 'either',
	postcode: '',
	krankenkasse: '',
	city: ''
};

/** Local demo patient — complete enough to match seeded Greifswald practices. */
export const demoPatientRequirements: PatientRequirements = {
	language: 'EN',
	specialty: 'Ophthalmology',
	insurance: 'GKV',
	location: 'Greifswald',
	newPatient: true,
	preferredWindow: '',
	modality: 'video',
	postcode: '17489',
	krankenkasse: 'TK',
	city: 'Greifswald'
};

/** Required for patient to reach /patient/match */
export const MATCH_REQUIRED_PATIENT = [
	'language',
	'specialty',
	'insurance',
	'location',
	'newPatient'
] as const;

/** Required for practice to enter matching candidate pool */
export const MATCH_REQUIRED_PRACTICE = [
	'languages',
	'specialties',
	'insuranceAccepted',
	'location',
	'acceptingNewPatients'
] as const;

/** Deliberate result-set limit (ohne Overchoice): show at most this many doctors. */
export const MATCH_RESULT_MAX = 5;
