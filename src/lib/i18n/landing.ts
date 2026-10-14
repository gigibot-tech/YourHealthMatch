export type LandingLang = 'EN' | 'DE';

export const LANDING = {
	EN: {
		navDemo: 'Try the demo',
		navGermany: 'Germany',
		navCta: 'Join the trial',
		kicker: 'Germany is the first pilot country',
		tagline: 'A doctor who already speaks your language.',
		pilotKicker: 'In this pilot',
		pilotPoints: [
			'You can look for a doctor who speaks your language.',
			'You can take part if you are a doctor or you have a clinic.',
			'Germany is the first country where we run this pilot.'
		],
		demoKicker: 'Demo',
		demoTitle: 'Are you a doctor, or do you have a clinic?',
		demoPoints: [
			'You do not need an account.',
			'You can start from the beginning and fill in your details.',
			'You can skip setup and try the clinic in Greifswald.'
		],
		patientTitle: 'I am looking for a doctor.',
		patientBody: 'I tell you my language and my insurance, and you match me with a practice.',
		patientCta: 'Start as a patient',
		clinicTitle: 'I am a doctor, or I have a clinic.',
		clinicBody: 'I set up my practice, and then I open my schedule and my available times.',
		clinicCta: 'Start as a doctor',
		skip: 'Skip setup',
		joinKicker: 'Your email',
		joinTitle: 'Leave your email.',
		joinLegend: 'Who is this for?',
		interest: 'Interest',
		clinic: 'Clinic or doctor',
		email: 'Email',
		send: 'Send',
		saving: 'Saving…',
		joined: 'You are on the list. We will write when a place in the pilot opens for you.',
		already: 'This email is already on the list for this choice.',
		invalid: 'Please enter a full email address.',
		unavailable: 'The list is not connected yet.',
		failed: 'We could not save that email. Please try again in a moment.'
	},
	DE: {
		navDemo: 'Demo ausprobieren',
		navGermany: 'Deutschland',
		navCta: 'Zur Warteliste',
		kicker: 'Deutschland ist das erste Pilotland',
		tagline: 'Eine Ärztin oder ein Arzt, die oder der Ihre Sprache spricht.',
		pilotKicker: 'In diesem Piloten',
		pilotPoints: [
			'Sie können eine Ärztin oder einen Arzt suchen, die oder der Ihre Sprache spricht.',
			'Sie können mitmachen, wenn Sie Ärztin oder Arzt sind oder eine Praxis haben.',
			'Deutschland ist das erste Land, in dem wir diesen Piloten führen.'
		],
		demoKicker: 'Demo',
		demoTitle: 'Sind Sie Ärztin oder Arzt, oder haben Sie eine Praxis?',
		demoPoints: [
			'Sie brauchen kein Konto.',
			'Sie können von vorn anfangen und Ihre Angaben machen.',
			'Sie können die Einrichtung überspringen und die Praxis in Greifswald ausprobieren.'
		],
		patientTitle: 'Ich suche eine Ärztin oder einen Arzt.',
		patientBody:
			'Ich nenne meine Sprache und meine Versicherung, und Sie finden eine passende Praxis für mich.',
		patientCta: 'Als Patientin oder Patient starten',
		clinicTitle: 'Ich bin Ärztin oder Arzt, oder ich habe eine Praxis.',
		clinicBody: 'Ich richte meine Praxis ein und öffne danach meinen Kalender und meine freien Zeiten.',
		clinicCta: 'Als Praxis starten',
		skip: 'Einrichtung überspringen',
		joinKicker: 'Ihre E-Mail',
		joinTitle: 'Hinterlassen Sie Ihre E-Mail.',
		joinLegend: 'Für wen ist das?',
		interest: 'Interesse',
		clinic: 'Praxis oder Ärztin, Arzt',
		email: 'E-Mail',
		send: 'Senden',
		saving: 'Wird gespeichert…',
		joined: 'Sie stehen auf der Liste. Wir schreiben Ihnen, wenn ein Platz im Piloten frei ist.',
		already: 'Diese E-Mail steht für diese Auswahl schon auf der Liste.',
		invalid: 'Bitte geben Sie eine vollständige E-Mail-Adresse ein.',
		unavailable: 'Die Liste ist noch nicht verbunden.',
		failed: 'Wir konnten diese E-Mail nicht speichern. Bitte versuchen Sie es gleich noch einmal.'
	}
} as const;
