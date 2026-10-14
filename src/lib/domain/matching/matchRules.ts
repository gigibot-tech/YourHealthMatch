/**
 * Five Phase-1 hard rules — one function per parameter.
 * All must pass for a doctor to enter the result set.
 */
import { coordsForPostcode, withinRadiusKm, IN_PERSON_RADIUS_KM } from '../geo/localGeo';
import type { Doctor, Practice } from '../practice/practiceProfileDefaults';
import type { PatientRequirements } from './matchDefaults';
import { languageLabel, practiceSpeaksLanguage } from './matchLanguages';

export type ProximityTier = 'exact_plz' | 'same_city' | 'prefix_plz' | 'radius' | 'none';

export type NextSlot = { date: string; time: string };

export function specialtyMatchesDoctor(doctor: Doctor, specialty: string): boolean {
	const want = specialty.trim().toLowerCase();
	if (!want) return false;
	const have = doctor.specialty.trim().toLowerCase();
	return have === want || have.includes(want) || want.includes(have);
}

/**
 * GKV requires KV-Zulassung. PKV / Selbstzahler (self_pay) match accepted list.
 * Legacy "private" is treated as Selbstzahler.
 */
export function insuranceAcceptedByPractice(
	practice: Practice,
	insurance: PatientRequirements['insurance']
): boolean {
	if (!insurance) return false;
	const accepted = practice.insuranceAccepted.map((x) => x.trim().toLowerCase());
	if (insurance === 'GKV') {
		return practice.kvApproved === true && accepted.includes('gkv');
	}
	if (insurance === 'PKV') {
		return accepted.includes('pkv');
	}
	if (insurance === 'self_pay' || insurance === 'private') {
		return (
			accepted.includes('self_pay') ||
			accepted.includes('private') ||
			accepted.includes('selbstzahler')
		);
	}
	return false;
}

export function doctorHasNextSlot(nextSlot: NextSlot | null | undefined): nextSlot is NextSlot {
	return Boolean(nextSlot?.date && nextSlot?.time);
}

function practiceCoords(practice: Practice) {
	if (typeof practice.lat === 'number' && typeof practice.lng === 'number') {
		return { lat: practice.lat, lng: practice.lng };
	}
	return coordsForPostcode(practice.postcode);
}

function patientCoords(requirements: PatientRequirements) {
	return coordsForPostcode(requirements.postcode);
}

export function proximityTier(
	requirements: PatientRequirements,
	practice: Practice
): ProximityTier {
	const reqPlz = (requirements.postcode || '').trim();
	const pPlz = (practice.postcode || '').trim();
	if (reqPlz && pPlz && reqPlz === pPlz) return 'exact_plz';

	const loc = (requirements.location || requirements.city || '').trim().toLowerCase();
	const pLoc = practice.location.trim().toLowerCase();
	if (loc && (pLoc.includes(loc) || loc.includes(pLoc))) return 'same_city';

	if (reqPlz.length >= 2 && pPlz.length >= 2 && reqPlz.slice(0, 2) === pPlz.slice(0, 2)) {
		return 'prefix_plz';
	}

	const from = patientCoords(requirements);
	const to = practiceCoords(practice);
	if (from && to && withinRadiusKm(from, to, IN_PERSON_RADIUS_KM)) return 'radius';

	return 'none';
}

/**
 * Offline (in_person): must be near (city, PLZ, or km radius when coords exist).
 * Video: proximity skipped.
 * Either: never excludes on distance.
 */
export function passesProximityRule(
	requirements: PatientRequirements,
	practice: Practice
): boolean {
	if (requirements.modality === 'video') return true;
	if (requirements.modality === 'either') return true;
	return proximityTier(requirements, practice) !== 'none';
}

export function acceptsNewPatientsWhenRequired(
	requirements: PatientRequirements,
	practice: Practice
): boolean {
	if (requirements.newPatient !== true) return true;
	return practice.acceptingNewPatients === true;
}

/** One patient-facing line for the next bookable opening. */
export function formatNextOpening(slot: NextSlot): string {
	const when = new Date(`${slot.date}T${slot.time}:00`);
	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	}).format(when);
}

export function languageReason(patientLanguage: string): string {
	return `Speaks ${languageLabel(patientLanguage)}`;
}

export function specialtyReason(specialty: string): string {
	return specialty;
}

export function insuranceReason(insurance: PatientRequirements['insurance']): string {
	if (insurance === 'GKV') return 'Public insurance (GKV)';
	if (insurance === 'PKV') return 'Private insurance (PKV)';
	if (insurance === 'self_pay' || insurance === 'private') return 'Self-pay';
	return insurance;
}

export function availabilityReason(slot: NextSlot): string {
	return `Next opening ${formatNextOpening(slot)}`;
}

export function videoReason(access: {
	kind: 'in_app' | 'external' | 'none';
	systemName?: string;
}): string | null {
	if (access.kind === 'in_app') return 'Video in this app';
	if (access.kind === 'external') return `Video on ${access.systemName || 'their booking system'}`;
	return null;
}

export function proximityReason(
	requirements: PatientRequirements,
	tier: ProximityTier
): string | null {
	if (requirements.modality === 'video') return 'Video visit';
	if (tier === 'exact_plz') return `Same postcode ${requirements.postcode}`;
	if (tier === 'same_city') return requirements.location || requirements.city || 'Nearby';
	if (tier === 'prefix_plz') return `Near postcode ${requirements.postcode}`;
	if (tier === 'radius') return `Within ${IN_PERSON_RADIUS_KM} km`;
	return null;
}

const PROXIMITY_RANK: Record<ProximityTier, number> = {
	exact_plz: 0,
	same_city: 1,
	prefix_plz: 2,
	radius: 3,
	none: 4
};

export function compareProximity(a: ProximityTier, b: ProximityTier): number {
	return PROXIMITY_RANK[a] - PROXIMITY_RANK[b];
}

export function compareNextSlot(a: NextSlot, b: NextSlot): number {
	const byDate = a.date.localeCompare(b.date);
	if (byDate !== 0) return byDate;
	return a.time.localeCompare(b.time);
}
