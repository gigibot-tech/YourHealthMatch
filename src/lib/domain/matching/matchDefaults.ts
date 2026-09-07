import {
	practiceProfileDefaults,
	type Practice
} from '../practice/practiceProfileDefaults';

export { practiceProfileDefaults };
export type { Practice };

export type InsuranceType = 'GKV' | 'PKV' | 'private' | '';

/** Patient demand fields — same SSOT as matching inputs (survey parity). */
export type PatientRequirements = {
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

export const MATCH_WEIGHTS = {
	language: 25,
	specialty: 25,
	insurance: 20,
	location: 15,
	newPatient: 10,
	availability: 5
} as const;
