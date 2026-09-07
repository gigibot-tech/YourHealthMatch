/**
 * Known booking / telemedicine / e-health systems patients or practices may already use.
 * Filter by specialty or location for UX; open via web URL (app deep-links when available).
 */

export type ExternalSystemKind =
	| 'booking'
	| 'telemedicine'
	| 'ehealth'
	| 'other';

export type ExternalSystem = {
	id: string;
	name: string;
	kind: ExternalSystemKind;
	/** Web entry — opens on click */
	url: string;
	/** Optional app / deep link scheme */
	appUrl?: string;
	/** Soft tags for specialty-aware UX */
	specialties?: string[];
	/** Soft tags for location-aware UX (city or region) */
	locations?: string[];
	blurb: string;
};

/** SSOT catalog — add rows here; UI and match cards read this list. */
export const EXTERNAL_SYSTEMS: ExternalSystem[] = [
	{
		id: 'doctolib',
		name: 'Doctolib',
		kind: 'booking',
		url: 'https://www.doctolib.de',
		specialties: ['General Practitioner', 'Dermatology', 'Dentist', 'Ophthalmology'],
		locations: ['Greifswald', 'Berlin', 'Hamburg', 'Munich'],
		blurb: 'Appointment booking used by many practices in Germany'
	},
	{
		id: 'doctena',
		name: 'Doctena',
		kind: 'booking',
		url: 'https://www.doctena.de',
		specialties: ['General Practitioner', 'Dentist'],
		locations: ['Berlin', 'Hamburg'],
		blurb: 'Online booking platform'
	},
	{
		id: 'arzt_direkt',
		name: 'arzt-direkt',
		kind: 'telemedicine',
		url: 'https://www.arzt-direkt.de',
		specialties: ['General Practitioner', 'Dermatology'],
		locations: ['Greifswald', 'Germany'],
		blurb: 'Video / telemedicine visits'
	},
	{
		id: 'jameda',
		name: 'jameda',
		kind: 'booking',
		url: 'https://www.jameda.de',
		specialties: ['General Practitioner', 'Dermatology', 'Dentist', 'Ophthalmology'],
		locations: ['Germany'],
		blurb: 'Doctor search and booking'
	},
	{
		id: 'cgm_clickdoc',
		name: 'CGM / Clickdoc',
		kind: 'ehealth',
		url: 'https://www.clickdoc.de',
		specialties: ['General Practitioner'],
		locations: ['Germany'],
		blurb: 'Practice software / e-health patient portal (CGM ecosystem)'
	},
	{
		id: 'kv_arztsuche',
		name: 'KV Arztsuche',
		kind: 'booking',
		url: 'https://www.kv-telematik.de',
		specialties: ['General Practitioner'],
		locations: ['Greifswald', 'Germany'],
		blurb: 'Official statutory physician search (KV)'
	},
	{
		id: 'yhm_video',
		name: 'YourHealthMatch Video',
		kind: 'telemedicine',
		url: '/video',
		specialties: [],
		locations: [],
		blurb: 'Built-in video visit (Agora) when you book here'
	}
];

export const SUGGEST_OTHER_ID = 'suggest_other';
export const CONTACT_EMAIL = 'contact@yourhealthmatch.com';

export type ExternalSystemPrefs = {
	/** Catalog ids the user already uses or wants shortcuts for */
	systemIds: string[];
	/** Free-text when they pick “suggest other” */
	suggestedName: string;
	suggestedNote: string;
};

export const externalSystemPrefsDefaults: ExternalSystemPrefs = {
	systemIds: [],
	suggestedName: '',
	suggestedNote: ''
};

export function getSystemById(id: string): ExternalSystem | undefined {
	return EXTERNAL_SYSTEMS.find((s) => s.id === id);
}

/** Prefer specialty/location matches first, then the rest of the catalog. */
export function systemsForContext(input: {
	specialty?: string;
	location?: string;
}): ExternalSystem[] {
	const specialty = (input.specialty || '').toLowerCase();
	const location = (input.location || '').toLowerCase();

	const scored = EXTERNAL_SYSTEMS.map((s) => {
		let score = 0;
		if (specialty && s.specialties?.some((x) => x.toLowerCase().includes(specialty) || specialty.includes(x.toLowerCase()))) {
			score += 2;
		}
		if (location && s.locations?.some((x) => x.toLowerCase().includes(location) || location.includes(x.toLowerCase()))) {
			score += 1;
		}
		return { s, score };
	});

	return scored.sort((a, b) => b.score - a.score).map((x) => x.s);
}

export function openUrlForSystem(system: ExternalSystem, preferApp = false): string {
	if (preferApp && system.appUrl) return system.appUrl;
	return system.url;
}

export function mailtoSuggestOther(name: string, note: string): string {
	const subject = encodeURIComponent(`Suggest external system: ${name || 'unknown'}`);
	const body = encodeURIComponent(
		`Hi YourHealthMatch team,\n\nI'd like you to add this booking / telemedicine / e-health system:\n\nName: ${name}\nNotes: ${note}\n\nThanks`
	);
	return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

/** Practice bookingChannel → catalog id (skip direct/phone). */
export const CHANNEL_TO_SYSTEM: Record<string, string> = {
	doctolib: 'doctolib',
	doctena: 'doctena',
	arzt_direkt: 'arzt_direkt',
	cgm: 'cgm_clickdoc'
};

export type LaunchReason = 'patient_pref' | 'practice_channel' | 'context';

export type AppLaunch = {
	id: string;
	name: string;
	href: string;
	reason: LaunchReason;
	/** Button copy */
	label: string;
};

/**
 * Build open-on-click targets from patient prefs ∪ practice channel ∪ optional doctor.
 * Pure — no IO. Practice bookingUrl wins over catalog URL when set.
 */
export function resolveLaunches(input: {
	patientSystemIds?: string[];
	practiceChannel?: string;
	practiceBookingUrl?: string;
	practiceName?: string;
	doctorName?: string;
	specialty?: string;
	location?: string;
	/** Include specialty/location suggestions (match page). Default false = only selected. */
	includeContext?: boolean;
}): AppLaunch[] {
	const out: AppLaunch[] = [];
	const seen = new Set<string>();

	const push = (launch: AppLaunch) => {
		if (seen.has(launch.id)) return;
		seen.add(launch.id);
		out.push(launch);
	};

	const withDoctor = (baseUrl: string, doctorName?: string) => {
		if (!doctorName?.trim()) return baseUrl;
		const q = encodeURIComponent(doctorName.trim());
		const join = baseUrl.includes('?') ? '&' : '?';
		return `${baseUrl}${join}q=${q}`;
	};

	// 1) Practice-selected channel (doctor side) — highest intent for this visit
	const channelId = input.practiceChannel
		? CHANNEL_TO_SYSTEM[input.practiceChannel]
		: undefined;
	if (channelId) {
		const sys = getSystemById(channelId);
		const base = input.practiceBookingUrl?.trim() || (sys ? openUrlForSystem(sys) : '');
		const href = base ? withDoctor(base, input.doctorName) : '';
		if (sys && href) {
			push({
				id: sys.id,
				name: sys.name,
				href,
				reason: 'practice_channel',
				label: input.doctorName
					? `Open ${input.doctorName} on ${sys.name}`
					: `Book on ${sys.name}`
			});
		}
	} else if (input.practiceBookingUrl?.trim()) {
		push({
			id: 'practice_custom',
			name: input.practiceName || 'Practice booking',
			href: withDoctor(input.practiceBookingUrl.trim(), input.doctorName),
			reason: 'practice_channel',
			label: input.doctorName
				? `Open ${input.doctorName} at practice`
				: 'Open practice booking link'
		});
	}

	// 2) Patient-selected systems
	for (const id of input.patientSystemIds ?? []) {
		if (id === SUGGEST_OTHER_ID || id === 'yhm_video') continue;
		const sys = getSystemById(id);
		if (!sys) continue;
		push({
			id: sys.id,
			name: sys.name,
			href: withDoctor(openUrlForSystem(sys), input.doctorName),
			reason: 'patient_pref',
			label: `Open ${sys.name}`
		});
	}

	// 3) Optional context suggestions (specialty / location)
	if (input.includeContext) {
		for (const sys of systemsForContext({
			specialty: input.specialty,
			location: input.location
		})) {
			if (sys.id === 'yhm_video') continue;
			push({
				id: sys.id,
				name: sys.name,
				href: withDoctor(openUrlForSystem(sys), input.doctorName),
				reason: 'context',
				label: `Try ${sys.name}`
			});
		}
	}

	return out;
}
