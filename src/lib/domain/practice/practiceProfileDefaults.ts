export type OnboardingStatus =
	| 'discovered'
	| 'contacted'
	| 'interested'
	| 'onboarded'
	| 'verified'
	| 'available_for_matching';

export type BookingChannel =
	| 'doctolib'
	| 'doctena'
	| 'arzt_direkt'
	| 'cgm'
	| 'direct'
	| 'phone';

export type WeeklyHours = Partial<
	Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', [string, string] | null>
>;

export type Doctor = {
	id: string;
	practiceId: string;
	name: string;
	specialty: string;
};

export type Practice = {
	id: string;
	name: string;
	languages: string[];
	specialties: string[];
	insuranceAccepted: string[];
	/** GKV matching requires KV-Zulassung on the practice. */
	kvApproved: boolean;
	location: string;
	postcode: string;
	acceptingNewPatients: boolean | null;
	availabilitySlots: { date: string; time: string }[];
	weeklyHours: WeeklyHours;
	modalities: string[];
	bookingChannel: BookingChannel;
	bookingUrl: string;
	onboardingStatus: OnboardingStatus;
	doctors: Doctor[];
};

export const practiceProfileDefaults: Practice = {
	id: '',
	name: '',
	languages: [],
	specialties: [],
	insuranceAccepted: [],
	kvApproved: false,
	location: '',
	postcode: '',
	acceptingNewPatients: null,
	availabilitySlots: [],
	weeklyHours: {
		mon: ['09:00', '17:00'],
		tue: ['09:00', '17:00'],
		wed: ['09:00', '17:00'],
		thu: ['09:00', '17:00'],
		fri: ['09:00', '17:00'],
		sat: null,
		sun: null
	},
	modalities: ['in_person'],
	bookingChannel: 'direct',
	bookingUrl: '',
	onboardingStatus: 'discovered',
	doctors: []
};
