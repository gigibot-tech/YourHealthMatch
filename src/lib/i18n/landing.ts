export type LandingLang = 'EN' | 'DE';

export const LANDING = {
	EN: {
		navHow: 'How it works',
		navClinics: 'Demo',
		navAbout: 'About',
		navContact: 'Contact',
		navCta: 'Find a doctor',
		langLabel: 'Language',
		heroKicker: 'Germany pilot',
		heroTitle: 'Find the right doctor in Germany.',
		heroSub:
			'YourHealthMatch helps international students, expats, and newcomers find a suitable doctor by language, location, and insurance.',
		heroCta: 'Find a doctor',
		heroClinic: 'I have a clinic',
		visualTitle: 'What a match checks',
		chips: ['Family doctor', 'Your language', 'Your location', 'Your insurance'],
		exampleLabel: 'Example',
		exampleRole: 'Family doctor',
		exampleMeta: 'English · German · Public insurance',
		visual: [
			{ label: 'Language', detail: 'A practice that lists yours' },
			{ label: 'Place and insurance', detail: 'Near you, and accepted cover' },
			{ label: 'An open time', detail: 'A slot the clinic published' }
		],
		problemKicker: 'The problem',
		problemTitle: 'Finding a doctor in Germany can be difficult.',
		problemIntro:
			'A new healthcare system, a new language, and an insurance question can sit in the way of a first visit.',
		problems: [
			{
				title: 'Language barriers',
				body: 'Many practices work in German only. A listing often never says which languages they speak.'
			},
			{
				title: 'An unfamiliar system',
				body: 'Family doctor, specialist, and emergency are not the same door.'
			},
			{
				title: 'Few trusted recommendations',
				body: 'Friends and forums are a start. They are not a practice with an open time.'
			},
			{
				title: 'Insurance questions',
				body: 'Public, private, and self-pay are not the same. A public patient needs a practice with KV approval.'
			}
		],
		solutionKicker: 'Our solution',
		solutionTitle: 'We only show a doctor when the facts line up.',
		solutionIntro:
			'You tell us your language, where you are, and your insurance. Matching stays a set of clear rules.',
		solutions: [
			{
				title: 'Language',
				body: 'The practice must list a language you speak.'
			},
			{
				title: 'Location',
				body: 'An in-person visit stays near your city. A video visit does not use distance.'
			},
			{
				title: 'Insurance',
				body: 'Public insurance matches only a practice approved for statutory care.'
			}
		],
		howKicker: 'How it works',
		howTitle: 'Find your doctor in three steps.',
		steps: [
			{
				title: 'Search and filter',
				body: 'Language, place, and insurance. A short note can point to a checkup, eyes, or skin.'
			},
			{
				title: 'Compare and choose',
				body: 'Each result says why that practice fits. There is no hidden score.'
			},
			{
				title: 'Book a visit',
				body: 'Take a time the clinic has opened, or open the practice’s own booking link.'
			}
		],
		benefitsKicker: 'Why YourHealthMatch',
		benefitsTitle: 'Built for a first visit in a new country.',
		benefits: [
			{ title: 'Your language first', body: 'German is not required to start.' },
			{ title: 'Reasons, not a score', body: 'Each card says why that doctor is shown.' },
			{ title: 'Real openings', body: 'Times come from the clinic diary, not a scraped list.' },
			{ title: 'A doctor you can return to', body: 'After you book, that doctor stays with the specialty.' }
		],
		trustKicker: 'Trust',
		trustTitle: 'What is true today.',
		trustIntro:
			'We do not show partner or university marks until an agreement exists. The pilot stands on these facts.',
		trust: [
			{ title: 'Germany first', body: 'This is the first country in the pilot.' },
			{ title: 'Greifswald demo', body: 'You can try a clinic without creating an account.' },
			{
				title: 'Six languages',
				body: 'German, English, Turkish, Arabic, Ukrainian, and Russian.'
			}
		],
		demoKicker: 'Demo',
		demoTitle: 'Try it as a patient, or as a clinic.',
		demoIntro:
			'You do not need an account. Start from the beginning, or skip setup and open the Greifswald clinic.',
		patientTitle: 'I am looking for a doctor.',
		patientBody: 'Tell us your language and your insurance, and we match you with a practice.',
		patientCta: 'Start as a patient',
		clinicTitle: 'I am a doctor, or I have a clinic.',
		clinicBody: 'Set up the practice, then open the schedule and the available times.',
		clinicCta: 'Start as a clinic',
		skip: 'Skip setup',
		finalKicker: 'Get started',
		finalTitle: 'Find a suitable doctor.',
		finalSub: 'Start with your language and insurance, or leave an email for a place in the pilot.',
		finalCta: 'Find a doctor',
		joinLegend: 'This email is for',
		interest: 'A patient place',
		clinic: 'A clinic place',
		email: 'Email',
		send: 'Join the list',
		saving: 'Saving…',
		joined: 'You are on the list. We will write when a place opens.',
		already: 'This email is already on the list for this choice.',
		invalid: 'Please enter a full email address.',
		unavailable: 'The list is not connected yet.',
		failed: 'We could not save that email. Please try again in a moment.',
		footerAbout: 'About',
		footerContact: 'Contact',
		footerPrivacy: 'Privacy',
		footerLegal: 'Legal notice',
		footerNote: 'A pilot. Not emergency care. In an emergency call 112.',
		aboutTitle: 'About',
		aboutLead:
			'YourHealthMatch is a pilot for people in Germany who need a doctor that fits their language, location, and insurance.',
		aboutBody:
			'We match international students and expats with practices that have published an opening. The product does not replace a medical practice, and it does not pull calendars from other booking apps.',
		privacyTitle: 'Privacy',
		privacyLead: 'What this pilot stores.',
		privacyPoints: [
			'Profile, matches, and appointments in the demo stay in this browser.',
			'If you join the list, we store the email and whether you are a patient or a clinic.',
			'We do not sell that address. We use it to write when a pilot place opens.',
			'Questions: contact@yourhealthmatch.com'
		],
		legalTitle: 'Legal notice',
		legalLead: 'This website is a product pilot.',
		legalPoints: [
			'It is not a medical practice and does not provide emergency care. Call 112 in an emergency.',
			'A full company imprint will be published before a commercial launch.',
			'Contact: contact@yourhealthmatch.com'
		],
		backHome: 'Back to home'
	},
	DE: {
		navHow: 'So funktioniert es',
		navClinics: 'Demo',
		navAbout: 'Über uns',
		navContact: 'Kontakt',
		navCta: 'Ärztin oder Arzt finden',
		langLabel: 'Sprache',
		heroKicker: 'Pilot in Deutschland',
		heroTitle: 'Finden Sie die passende Ärztin oder den passenden Arzt in Deutschland.',
		heroSub:
			'YourHealthMatch hilft internationalen Studierenden, Expats und Zugezogenen, eine passende Ärztin oder einen passenden Arzt nach Sprache, Ort und Versicherung zu finden.',
		heroCta: 'Ärztin oder Arzt finden',
		heroClinic: 'Ich habe eine Praxis',
		visualTitle: 'Was ein Treffer prüft',
		chips: ['Hausärztin, Hausarzt', 'Ihre Sprache', 'Ihr Ort', 'Ihre Versicherung'],
		exampleLabel: 'Beispiel',
		exampleRole: 'Hausärztin, Hausarzt',
		exampleMeta: 'Englisch · Deutsch · Gesetzlich',
		visual: [
			{ label: 'Sprache', detail: 'Eine Praxis, die Ihre Sprache führt' },
			{ label: 'Ort und Versicherung', detail: 'In Ihrer Nähe, mit passender Abrechnung' },
			{ label: 'Eine freie Zeit', detail: 'Ein Termin, den die Praxis geöffnet hat' }
		],
		problemKicker: 'Das Problem',
		problemTitle: 'Eine Ärztin oder einen Arzt in Deutschland zu finden kann schwer sein.',
		problemIntro:
			'Ein neues Gesundheitssystem, eine neue Sprache und eine Frage zur Versicherung stehen oft vor dem ersten Besuch.',
		problems: [
			{
				title: 'Sprachbarrieren',
				body: 'Viele Praxen arbeiten nur auf Deutsch. Ein Verzeichnis sagt oft nicht, welche Sprachen sie sprechen.'
			},
			{
				title: 'Ein unbekanntes System',
				body: 'Hausarzt, Facharzt und Notfall sind nicht dieselbe Tür.'
			},
			{
				title: 'Wenige verlässliche Empfehlungen',
				body: 'Freunde und Foren sind ein Anfang. Sie sind keine Praxis mit einem freien Termin.'
			},
			{
				title: 'Fragen zur Versicherung',
				body: 'Gesetzlich, privat und Selbstzahler sind nicht dasselbe. Gesetzlich Versicherte brauchen eine Praxis mit KV-Zulassung.'
			}
		],
		solutionKicker: 'Unsere Lösung',
		solutionTitle: 'Wir zeigen nur eine Ärztin oder einen Arzt, wenn die Angaben zusammenpassen.',
		solutionIntro:
			'Sie nennen Sprache, Ort und Versicherung. Die Zuordnung bleibt ein Satz klarer Regeln.',
		solutions: [
			{
				title: 'Sprache',
				body: 'Die Praxis muss eine Sprache führen, die Sie sprechen.'
			},
			{
				title: 'Ort',
				body: 'Ein Besuch vor Ort bleibt in Ihrer Nähe. Ein Videotermin nutzt die Entfernung nicht.'
			},
			{
				title: 'Versicherung',
				body: 'Gesetzlich Versicherte passen nur zu einer Praxis mit Zulassung für die Versorgung.'
			}
		],
		howKicker: 'So funktioniert es',
		howTitle: 'In drei Schritten zur passenden Praxis.',
		steps: [
			{
				title: 'Suchen und filtern',
				body: 'Sprache, Ort und Versicherung. Eine kurze Notiz kann auf Vorsorge, Augen oder Haut zeigen.'
			},
			{
				title: 'Vergleichen und wählen',
				body: 'Jedes Ergebnis sagt, warum die Praxis passt. Es gibt keine versteckte Punktzahl.'
			},
			{
				title: 'Einen Besuch buchen',
				body: 'Nehmen Sie eine Zeit, die die Praxis geöffnet hat, oder öffnen Sie ihren eigenen Buchungslink.'
			}
		],
		benefitsKicker: 'Warum YourHealthMatch',
		benefitsTitle: 'Für den ersten Besuch in einem neuen Land.',
		benefits: [
			{ title: 'Zuerst Ihre Sprache', body: 'Deutsch ist nicht nötig, um zu beginnen.' },
			{ title: 'Gründe, keine Punktzahl', body: 'Jede Karte sagt, warum diese Person gezeigt wird.' },
			{ title: 'Echte Termine', body: 'Zeiten kommen aus dem Praxiskalender, nicht aus einer kopierten Liste.' },
			{
				title: 'Eine Ärztin oder ein Arzt zum Wiederkommen',
				body: 'Nach der Buchung bleibt diese Person bei dem Fachgebiet.'
			}
		],
		trustKicker: 'Vertrauen',
		trustTitle: 'Was heute stimmt.',
		trustIntro:
			'Wir zeigen keine Partner- oder Hochschulzeichen, bevor eine Vereinbarung besteht. Der Pilot steht auf diesen Angaben.',
		trust: [
			{ title: 'Zuerst Deutschland', body: 'Das ist das erste Land in diesem Piloten.' },
			{ title: 'Demo in Greifswald', body: 'Sie können eine Praxis ohne Konto ausprobieren.' },
			{
				title: 'Sechs Sprachen',
				body: 'Deutsch, Englisch, Türkisch, Arabisch, Ukrainisch und Russisch.'
			}
		],
		demoKicker: 'Demo',
		demoTitle: 'Probieren Sie es als Patientin oder Patient, oder als Praxis.',
		demoIntro:
			'Sie brauchen kein Konto. Sie können von vorn anfangen, oder die Einrichtung überspringen und die Praxis in Greifswald öffnen.',
		patientTitle: 'Ich suche eine Ärztin oder einen Arzt.',
		patientBody:
			'Ich nenne meine Sprache und meine Versicherung, und Sie finden eine passende Praxis.',
		patientCta: 'Als Patientin oder Patient starten',
		clinicTitle: 'Ich bin Ärztin oder Arzt, oder ich habe eine Praxis.',
		clinicBody: 'Ich richte die Praxis ein und öffne danach den Kalender und die freien Zeiten.',
		clinicCta: 'Als Praxis starten',
		skip: 'Einrichtung überspringen',
		finalKicker: 'Beginnen',
		finalTitle: 'Finden Sie eine passende Ärztin oder einen passenden Arzt.',
		finalSub:
			'Beginnen Sie mit Sprache und Versicherung, oder hinterlassen Sie eine E-Mail für einen Platz im Piloten.',
		finalCta: 'Ärztin oder Arzt finden',
		joinLegend: 'Diese E-Mail ist für',
		interest: 'Einen Patientenplatz',
		clinic: 'Einen Praxisplatz',
		email: 'E-Mail',
		send: 'Auf die Liste',
		saving: 'Wird gespeichert…',
		joined: 'Sie stehen auf der Liste. Wir schreiben, wenn ein Platz frei ist.',
		already: 'Diese E-Mail steht für diese Auswahl schon auf der Liste.',
		invalid: 'Bitte geben Sie eine vollständige E-Mail-Adresse ein.',
		unavailable: 'Die Liste ist noch nicht verbunden.',
		failed: 'Wir konnten diese E-Mail nicht speichern. Bitte versuchen Sie es gleich noch einmal.',
		footerAbout: 'Über uns',
		footerContact: 'Kontakt',
		footerPrivacy: 'Datenschutz',
		footerLegal: 'Impressum',
		footerNote: 'Ein Pilot. Keine Notfallversorgung. Im Notfall 112.',
		aboutTitle: 'Über uns',
		aboutLead:
			'YourHealthMatch ist ein Pilot für Menschen in Deutschland, die eine Ärztin oder einen Arzt nach Sprache, Ort und Versicherung brauchen.',
		aboutBody:
			'Wir verbinden internationale Studierende und Zugezogene mit Praxen, die einen Termin veröffentlicht haben. Das Produkt ersetzt keine Praxis und liest keine Kalender anderer Buchungsdienste.',
		privacyTitle: 'Datenschutz',
		privacyLead: 'Was dieser Pilot speichert.',
		privacyPoints: [
			'Profil, Treffer und Termine in der Demo bleiben in diesem Browser.',
			'Wenn Sie sich eintragen, speichern wir die E-Mail und ob Sie Patientin, Patient oder Praxis sind.',
			'Wir verkaufen diese Adresse nicht. Wir nutzen sie, um zu schreiben, wenn ein Platz frei ist.',
			'Fragen: contact@yourhealthmatch.com'
		],
		legalTitle: 'Impressum',
		legalLead: 'Diese Website ist ein Produktpilot.',
		legalPoints: [
			'Sie ist keine Arztpraxis und leistet keine Notfallversorgung. Im Notfall 112.',
			'Ein vollständiges Impressum des Betreibers wird vor einem kommerziellen Start veröffentlicht.',
			'Kontakt: contact@yourhealthmatch.com'
		],
		backHome: 'Zur Startseite'
	}
} as const;
