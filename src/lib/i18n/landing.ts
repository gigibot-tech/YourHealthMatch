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
		heroTitle: 'Find the right doctor. Feel at home in Germany.',
		heroSub:
			'YourHealthMatch helps international students, expats, and newcomers find suitable doctors and dentists based on language, location, and health insurance.',
		heroCta: 'Explore the demo',
		heroWaitlist: 'Join the waitlist',
		heroDemoNote:
			'This saves a demo profile in this browser, then shows doctors that fit your language, place, and insurance.',
		heroClinic: 'I have a clinic',
		visualTitle: 'What a match checks',
		chips: ['Your language', 'Your location', 'Your insurance'],
		exampleLabel: 'Example',
		exampleRole: 'Family doctor',
		exampleMeta: 'English · German · Public insurance',
		visual: [
			{ label: 'Language', detail: 'A practice that lists yours' },
			{ label: 'Place and insurance', detail: 'Near you, and accepted cover' },
			{ label: 'An open time', detail: 'A slot the clinic published' }
		],
		problemKicker: 'The problem',
		problemTitle: 'Healthcare navigation in Germany does not guarantee the right next step.',
		problemIntro:
			'Specialist care is hard to reach even for people who grew up here. Internationals face that same search, and more: a new system, new insurance rules, and a desk that may not speak their language. Native speakers can still navigate the landscape because it is in their language. Newcomers often cannot, so the right time is harder to find.',
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
				body: 'Friends and forums are a start. They are not a practice with the right time.'
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
		howTitle: 'Three steps. No hidden score.',
		steps: [
			{
				title: 'Find',
				body: 'Search by location, language, and insurance.'
			},
			{
				title: 'Match',
				body: 'See doctors whose language and insurance fit.'
			},
			{
				title: 'Feel at home',
				body: 'A real place in the pilot starts on the waitlist.'
			}
		],
		benefitsKicker: 'Why YourHealthMatch',
		benefitsTitle: 'Built for a first visit in a new country.',
		benefits: [
			{ title: 'Your language first', body: 'German is not required to start.' },
			{ title: 'Reasons, not a score', body: 'Each card says why that doctor is shown.' },
			{ title: 'Real openings', body: 'Times come from the clinic diary, not a scraped list.' },
			{ title: 'A doctor you can hopefully return to', body: 'After you book, that doctor stays with the specialty.' }
		],
		trustKicker: 'Trust',
		trustTitle: 'What is true today.',
		trustIntro:
			'We do not show partner or university marks until an agreement exists. The pilot stands on these facts.',
		trust: [
			{ title: 'Germany first', body: 'This is the first country in the pilot.' },
			{
				title: 'Greifswald demo',
				body: 'In Mecklenburg-Vorpommern. We are trying to partner with international offices and universities first. You can try a clinic without creating an account.'
			},
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
		sampleKicker: 'Try it',
		sampleTitle: 'See how a match would look.',
		sampleEmpty: 'No doctors for that combination. This example is Greifswald only.',
		sampleHomeTitle: 'Want a real place?',
		sampleHomeBody:
			'The doctors on this page are mocked examples. A real place in the pilot starts on the waitlist.',
		sampleHomeCta: 'Join the waitlist',
		filterLocation: 'Location',
		filterType: 'Healthcare type',
		filterLanguage: 'Preferred language',
		filterInsurance: 'Insurance',
		filterAny: 'Any',
		filterFamily: 'Family doctor',
		filterDentist: 'Dentist',
		filterEye: 'Eye care',
		filterSkin: 'Skin',
		filterEn: 'English',
		filterDe: 'German',
		filterAr: 'Arabic',
		filterPublic: 'Public',
		filterPrivate: 'Private',
		whoKicker: 'Who we help',
		whoTitle: 'Built for a first year in Germany.',
		who: [
			{
				title: 'International students',
				body: 'A practice that lists your language, near campus, and accepts your cover.'
			},
			{
				title: 'Expats',
				body: 'Public, private, or self-pay stated up front, before you call.'
			},
			{
				title: 'Newcomers',
				body: 'Family doctor, dentist, and specialist are not the same door.'
			}
		],
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
		aboutCirclesKicker: 'How matching works',
		aboutCirclesTitle: 'Three things must meet.',
		aboutCirclesLead:
			'You, care, and connection overlap. Where they meet is the right match — not a score, a clear fit.',
		aboutMatchLabel: 'The Right Match',
		aboutCircles: [
			{
				id: 'people',
				label: 'You',
				detail:
					'Your language, your situation, and what you need from a first visit in a new country.'
			},
			{
				id: 'access',
				label: 'Care',
				detail:
					'Doctors and dentists who list a language, a place, and the insurance they accept.'
			},
			{
				id: 'providers',
				label: 'Connection',
				detail:
					'A visible route from what you need to a practice that fits. Not a hidden score.'
			}
		] as const,
		aboutCirclesHint: 'Select a circle to read more.',
		aboutMapKicker: 'From search to visit',
		aboutMapTitle: 'A path to the right doctor.',
		aboutMapLead:
			'Matching is a journey: you start with what you need, then follow a clear route to a practice that fits.',
		aboutMapCaption:
			'Illustrative map — not live clinic locations. Markers show example fits for language, place, and insurance.',
		aboutMapYou: 'You',
		aboutMapMatch: 'Your Match',
		aboutMapProviders: [
			{
				id: 'a',
				name: 'Family practice',
				language: 'English · German',
				area: 'Near the centre',
				insurance: 'Public insurance'
			},
			{
				id: 'b',
				name: 'Walk-in clinic',
				language: 'German',
				area: 'East of the river',
				insurance: 'Public · private'
			},
			{
				id: 'c',
				name: 'Your Match',
				language: 'English · Arabic',
				area: 'Campus area',
				insurance: 'Public insurance'
			}
		] as const,
		privacyTitle: 'Privacy',
		privacyLead: 'What this pilot stores.',
		privacyPoints: [
			'Profile, matches, and appointments in the demo stay in this browser.',
			'If you join the list, we store the email and whether you are a patient or a clinic.',
			'We do not sell that address. We use it to write when a pilot place opens.',
			'Questions: contact@yourhealthmatch.de'
		],
		legalTitle: 'Legal notice',
		legalLead: 'This website is a product pilot.',
		legalPoints: [
			'It is not a medical practice and does not provide emergency care. Call 112 in an emergency.',
			'A full company imprint will be published before a commercial launch.',
			'Contact: contact@yourhealthmatch.de'
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
		heroTitle: 'Finden Sie die passende Ärztin oder den passenden Arzt. Fühlen Sie sich in Deutschland zu Hause.',
		heroSub:
			'YourHealthMatch hilft internationalen Studierenden, Expats und Zugezogenen, passende Ärztinnen, Ärzte und Zahnärztinnen nach Sprache, Ort und Versicherung zu finden.',
		heroCta: 'Demo öffnen',
		heroWaitlist: 'Auf die Warteliste',
		heroDemoNote:
			'Das speichert ein Demoprofil in diesem Browser und zeigt dann Praxen, die zu Sprache, Ort und Versicherung passen.',
		heroClinic: 'Ich habe eine Praxis',
		visualTitle: 'Was ein Treffer prüft',
		chips: ['Ihre Sprache', 'Ihr Ort', 'Ihre Versicherung'],
		exampleLabel: 'Beispiel',
		exampleRole: 'Hausärztin, Hausarzt',
		exampleMeta: 'Englisch · Deutsch · Gesetzlich',
		visual: [
			{ label: 'Sprache', detail: 'Eine Praxis, die Ihre Sprache führt' },
			{ label: 'Ort und Versicherung', detail: 'In Ihrer Nähe, mit passender Abrechnung' },
			{ label: 'Eine freie Zeit', detail: 'Ein Termin, den die Praxis geöffnet hat' }
		],
		problemKicker: 'Das Problem',
		problemTitle:
			'Die Navigation im deutschen Gesundheitswesen garantiert nicht den richtigen nächsten Schritt.',
		problemIntro:
			'Einen Facharzt zu erreichen ist auch für Menschen schwer, die hier aufgewachsen sind. Internationale haben dieselbe Suche, und mehr: ein neues System, neue Versicherungsregeln und einen Tresen, der ihre Sprache vielleicht nicht spricht. Muttersprachler können sich orientieren, weil die Landschaft in ihrer Sprache ist. Zugezogene oft nicht, deshalb ist der richtige Zeitpunkt schwerer zu finden.',
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
				body: 'Freunde und Foren sind ein Anfang. Sie sind keine Praxis mit dem richtigen Zeitpunkt.'
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
		howTitle: 'Drei Schritte. Keine versteckte Punktzahl.',
		steps: [
			{
				title: 'Finden',
				body: 'Suchen Sie nach Ort, Sprache und Versicherung.'
			},
			{
				title: 'Treffer',
				body: 'Sehen Sie Ärztinnen und Ärzte, deren Sprache und Versicherung passen.'
			},
			{
				title: 'Zu Hause fühlen',
				body: 'Ein echter Platz im Piloten beginnt auf der Warteliste.'
			}
		],
		benefitsKicker: 'Warum YourHealthMatch',
		benefitsTitle: 'Für den ersten Besuch in einem neuen Land.',
		benefits: [
			{ title: 'Zuerst Ihre Sprache', body: 'Deutsch ist nicht nötig, um zu beginnen.' },
			{ title: 'Gründe, keine Punktzahl', body: 'Jede Karte sagt, warum diese Person gezeigt wird.' },
			{ title: 'Echte Termine', body: 'Zeiten kommen aus dem Praxiskalender, nicht aus einer kopierten Liste.' },
			{
				title: 'Eine Ärztin oder ein Arzt, zu der oder dem Sie hoffentlich zurückkehren',
				body: 'Nach der Buchung bleibt diese Person bei dem Fachgebiet.'
			}
		],
		trustKicker: 'Vertrauen',
		trustTitle: 'Was heute stimmt.',
		trustIntro:
			'Wir zeigen keine Partner- oder Hochschulzeichen, bevor eine Vereinbarung besteht. Der Pilot steht auf diesen Angaben.',
		trust: [
			{ title: 'Zuerst Deutschland', body: 'Das ist das erste Land in diesem Piloten.' },
			{
				title: 'Demo in Greifswald',
				body: 'In Mecklenburg-Vorpommern. Zuerst wollen wir mit International Offices und Hochschulen zusammenarbeiten. Sie können eine Praxis ohne Konto ausprobieren.'
			},
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
		sampleKicker: 'Ausprobieren',
		sampleTitle: 'So würde ein Treffer aussehen.',
		sampleEmpty: 'Keine Ärztinnen oder Ärzte für diese Auswahl. Dieses Beispiel ist nur Greifswald.',
		sampleHomeTitle: 'Einen echten Platz?',
		sampleHomeBody:
			'Die Ärztinnen und Ärzte auf dieser Seite sind erfundene Beispiele. Ein echter Platz im Piloten beginnt auf der Warteliste.',
		sampleHomeCta: 'Auf die Warteliste',
		filterLocation: 'Ort',
		filterType: 'Art der Versorgung',
		filterLanguage: 'Bevorzugte Sprache',
		filterInsurance: 'Versicherung',
		filterAny: 'Alle',
		filterFamily: 'Hausärztin, Hausarzt',
		filterDentist: 'Zahnärztin, Zahnarzt',
		filterEye: 'Augen',
		filterSkin: 'Haut',
		filterEn: 'Englisch',
		filterDe: 'Deutsch',
		filterAr: 'Arabisch',
		filterPublic: 'Gesetzlich',
		filterPrivate: 'Privat',
		whoKicker: 'Wen wir unterstützen',
		whoTitle: 'Für das erste Jahr in Deutschland.',
		who: [
			{
				title: 'Internationale Studierende',
				body: 'Eine Praxis, die Ihre Sprache führt, in Campusnähe liegt und Ihre Versicherung annimmt.'
			},
			{
				title: 'Expats',
				body: 'Gesetzlich, privat oder selbstzahlend steht fest, bevor Sie anrufen.'
			},
			{
				title: 'Zugezogene',
				body: 'Hausärztin, Zahnärztin und Fachärztin sind nicht dieselbe Tür.'
			}
		],
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
		aboutCirclesKicker: 'So funktioniert die Zuordnung',
		aboutCirclesTitle: 'Drei Dinge müssen zusammenkommen.',
		aboutCirclesLead:
			'Sie, Versorgung und Verbindung überlappen. Wo sie sich treffen, ist der passende Treffer — kein versteckter Score, ein klarer Fit.',
		aboutMatchLabel: 'Der passende Treffer',
		aboutCircles: [
			{
				id: 'people',
				label: 'Sie',
				detail:
					'Ihre Sprache, Ihre Lage und das, was Sie beim ersten Besuch in einem neuen Land brauchen.'
			},
			{
				id: 'access',
				label: 'Versorgung',
				detail:
					'Ärztinnen, Ärzte und Zahnärztinnen, die Sprache, Ort und angenommene Versicherung angeben.'
			},
			{
				id: 'providers',
				label: 'Verbindung',
				detail:
					'Ein sichtbarer Weg von dem, was Sie brauchen, zu einer passenden Praxis. Keine versteckte Punktzahl.'
			}
		] as const,
		aboutCirclesHint: 'Wählen Sie einen Kreis, um mehr zu lesen.',
		aboutMapKicker: 'Von der Suche zum Termin',
		aboutMapTitle: 'Ein Weg zur passenden Ärztin oder zum passenden Arzt.',
		aboutMapLead:
			'Die Zuordnung ist ein Weg: Sie beginnen mit dem, was Sie brauchen, und folgen einer klaren Route zu einer passenden Praxis.',
		aboutMapCaption:
			'Illustrierte Karte — keine echten Praxisstandorte. Die Markierungen zeigen Beispieltreffer für Sprache, Ort und Versicherung.',
		aboutMapYou: 'Sie',
		aboutMapMatch: 'Ihr Treffer',
		aboutMapProviders: [
			{
				id: 'a',
				name: 'Hausarztpraxis',
				language: 'Englisch · Deutsch',
				area: 'Nahe dem Zentrum',
				insurance: 'Gesetzlich'
			},
			{
				id: 'b',
				name: 'Ambulanz',
				language: 'Deutsch',
				area: 'Östlich des Flusses',
				insurance: 'Gesetzlich · privat'
			},
			{
				id: 'c',
				name: 'Ihr Treffer',
				language: 'Englisch · Arabisch',
				area: 'Campusnähe',
				insurance: 'Gesetzlich'
			}
		] as const,
		privacyTitle: 'Datenschutz',
		privacyLead: 'Was dieser Pilot speichert.',
		privacyPoints: [
			'Profil, Treffer und Termine in der Demo bleiben in diesem Browser.',
			'Wenn Sie sich eintragen, speichern wir die E-Mail und ob Sie Patientin, Patient oder Praxis sind.',
			'Wir verkaufen diese Adresse nicht. Wir nutzen sie, um zu schreiben, wenn ein Platz frei ist.',
			'Fragen: contact@yourhealthmatch.de'
		],
		legalTitle: 'Impressum',
		legalLead: 'Diese Website ist ein Produktpilot.',
		legalPoints: [
			'Sie ist keine Arztpraxis und leistet keine Notfallversorgung. Im Notfall 112.',
			'Ein vollständiges Impressum des Betreibers wird vor einem kommerziellen Start veröffentlicht.',
			'Kontakt: contact@yourhealthmatch.de'
		],
		backHome: 'Zur Startseite'
	}
} as const;
