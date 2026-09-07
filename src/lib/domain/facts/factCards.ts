/**
 * SSOT for dashboard fact cards (patient waiting-time stats + doctor clinic facts).
 *
 * External appointments: YourHealthMatch stores local/demo bookings only
 * (`appointmentRepo`). Practices may *declare* a Doctolib / Doctena / arzt-direkt / CGM
 * channel (`bookingChannel` + catalog), and patients may save those apps as shortcuts.
 * We do **not** ingest third-party calendars, so a booking that exists only on
 * Doctolib/Doctena/CGM cannot appear here. If a local appointment sits at a practice
 * with an external channel (seed: Hausarztpraxis Davis → Doctolib), we treat that
 * visit as external-linked and can show a shortcut — still not a live sync.
 */

export type FactAudience = 'patient' | 'doctor';

export type FactRegion = 'Greifswald' | 'MV' | 'Germany';

export type FactWhen = 'has_appointment' | 'no_appointment' | 'always';

export type FactSource = {
	label: string;
	url: string;
	year: number;
	/** Qualify approximate, regional, TSS-only, or vendor-reported figures. */
	note?: string;
};

export type FactCard = {
	id: string;
	audience: FactAudience;
	title: string;
	body: string;
	source?: FactSource;
	href?: string;
	hrefLabel?: string;
	specialty?: string | string[];
	region?: FactRegion;
	/** Default `has_appointment` — primary carousel is appointment-present. */
	when?: FactWhen;
	/** Only when a local visit is at a practice with an external booking channel. */
	externalLinked?: boolean;
};

export type FactSelectInput = {
	audience: FactAudience;
	specialties?: string[];
	location?: string;
	city?: string;
	postcode?: string;
	hasAppointment: boolean;
	hasExternalLinkedAppointment?: boolean;
	extraCards?: FactCard[];
};

const SPECIALTY_ALIASES: Record<string, string[]> = {
	'general practitioner': ['gp', 'hausarzt', 'family', 'primary'],
	ophthalmology: ['augen', 'eye'],
	dermatology: ['haut', 'skin'],
	dentist: ['zahn', 'dental']
};

function norm(s: string): string {
	return s.trim().toLowerCase();
}

function specialtyTokens(name: string): string[] {
	const n = norm(name);
	const extra = SPECIALTY_ALIASES[n] ?? [];
	return [n, ...extra];
}

export function specialtyMatches(cardSpecialty: string | string[] | undefined, specialties: string[]): boolean {
	if (!cardSpecialty) return true;
	if (!specialties.length) return false;
	const needed = (Array.isArray(cardSpecialty) ? cardSpecialty : [cardSpecialty]).map(specialtyTokens);
	return specialties.some((got) => {
		const gotTokens = specialtyTokens(got);
		return needed.some((need) =>
			need.some((n) => gotTokens.some((g) => g.includes(n) || n.includes(g)))
		);
	});
}

/** Postcodes 17xxx–19xxx cover most of Mecklenburg-Vorpommern (Greifswald is 17489). */
export function regionTags(input: {
	location?: string;
	city?: string;
	postcode?: string;
}): FactRegion[] {
	const text = `${input.location || ''} ${input.city || ''}`.toLowerCase();
	const plz = (input.postcode || '').replace(/\s/g, '');
	const tags = new Set<FactRegion>(['Germany']);
	const greifswald =
		text.includes('greifswald') ||
		plz === '17489' ||
		plz === '17491' ||
		plz === '17493' ||
		plz === '17495' ||
		plz === '17498';
	const mv =
		greifswald ||
		text.includes('mecklenburg') ||
		text.includes('vorpommern') ||
		/\bmv\b/.test(text) ||
		/^1[7-9]\d{3}$/.test(plz);
	if (mv) tags.add('MV');
	if (greifswald) tags.add('Greifswald');
	return [...tags];
}

function regionMatches(cardRegion: FactRegion | undefined, tags: FactRegion[]): boolean {
	if (!cardRegion) return true;
	return tags.includes(cardRegion);
}

function whenMatches(when: FactWhen | undefined, hasAppointment: boolean): boolean {
	const w = when ?? 'has_appointment';
	if (w === 'always') return true;
	if (w === 'has_appointment') return hasAppointment;
	return !hasAppointment;
}

function scoreCard(card: FactCard, input: FactSelectInput, tags: FactRegion[]): number {
	let score = 0;
	if (card.specialty && specialtyMatches(card.specialty, input.specialties ?? [])) score += 12;
	if (card.region === 'Greifswald' && tags.includes('Greifswald')) score += 8;
	else if (card.region === 'MV' && tags.includes('MV')) score += 5;
	else if (card.region === 'Germany') score += 1;
	if (card.externalLinked && input.hasExternalLinkedAppointment) score += 20;
	if ((card.when ?? 'has_appointment') === 'has_appointment' && input.hasAppointment) score += 2;
	return score;
}

/** Filter + rank fact cards for a role, location, specialty, and appointment state. */
export function selectFacts(input: FactSelectInput, catalog: FactCard[] = FACT_CARDS): FactCard[] {
	const tags = regionTags(input);
	const specialties = (input.specialties ?? []).filter(Boolean);
	const pool = [...catalog, ...(input.extraCards ?? [])];
	return pool
		.filter((card) => {
			if (card.audience !== input.audience) return false;
			if (!whenMatches(card.when, input.hasAppointment)) return false;
			if (card.externalLinked && !input.hasExternalLinkedAppointment) return false;
			if (!specialtyMatches(card.specialty, specialties)) return false;
			if (!regionMatches(card.region, tags)) return false;
			return true;
		})
		.sort((a, b) => scoreCard(b, input, tags) - scoreCard(a, input, tags) || a.id.localeCompare(b.id));
}

export const FACT_CARDS: FactCard[] = [
	// —— Patient: waiting times & redirects ——
	{
		id: 'patient-de-specialist-wait',
		audience: 'patient',
		title: 'Typical specialist wait in Germany',
		body: 'In 2024, GKV patients waited 36 days on average for a specialist appointment (42 days if they waited at least one day; 33 days in 2019). Same-day visits pull the average down. Your booked visit here is already on the calendar — use Match if you still need another specialty.',
		source: {
			label: 'Deutsches Ärzteblatt (BMG / Bewertungsausschuss Versichertenbefragung)',
			url: 'https://www.aerzteblatt.de/news/gesetzlich-versicherte-warten-im-schnitt-funf-wochen-auf-facharzttermin-b2b64c64-4546-4775-a6fe-91b31e296bd8',
			year: 2024,
			note: 'Survey average for Germany; not a Greifswald measurement.'
		},
		href: '/patient/match',
		hrefLabel: 'Find another match',
		region: 'Germany'
	},
	{
		id: 'patient-tss-116117',
		audience: 'patient',
		title: 'Terminservicestelle 116117',
		body: 'For urgent statutory-care specialist visits, the TSS aims to offer a slot within a week, with the visit usually within four weeks. In 2024, 97% of TSS bookings nationwide met that legal deadline. Eye and gynaecology appointments usually need no referral.',
		source: {
			label: 'KBV Evaluationsbericht 116117-Terminservice; BMG patients’ rights',
			url: 'https://www.kbv.de/documents/infothek/zahlen-und-fakten/evaluationsberichte-tss/bericht-116117-terminservicestellen-2024.pdf',
			year: 2024,
			note: 'TSS-mediated bookings, not all practice diaries. MV does not fully use the national 116117 online stack.'
		},
		href: 'https://www.116117.de',
		hrefLabel: 'Open 116117.de',
		region: 'Germany',
		when: 'always'
	},
	{
		id: 'patient-tss-gp-wait',
		audience: 'patient',
		title: 'GP waits via 116117',
		body: 'Among TSS-mediated bookings in 2024, GP and ENT appointments averaged about 3 days from first mediation attempt. That is the TSS queue — calling a local Hausarzt can still be faster or slower.',
		source: {
			label: 'KBV Evaluationsbericht 116117-Terminservice 2024',
			url: 'https://www.kbv.de/documents/infothek/zahlen-und-fakten/evaluationsberichte-tss/bericht-116117-terminservicestellen-2024.pdf',
			year: 2024,
			note: 'TSS bookings only; not an open-market wait time.'
		},
		href: 'https://www.116117.de',
		hrefLabel: 'Book via 116117',
		specialty: 'General Practitioner',
		region: 'Germany'
	},
	{
		id: 'patient-ophtho-116117',
		audience: 'patient',
		title: 'Eye appointments: no referral for 116117',
		body: 'You can ask 116117 for an ophthalmology slot without a GP referral. Eye care is among the specialties patients search most often on the national TSS. If this booked visit is routine, keep it; for something more urgent, 116117 is the statutory backstop.',
		source: {
			label: 'BMG Terminservicestellen; KBV 2024 (search volume)',
			url: 'https://www.bundesgesundheitsministerium.de/themen/krankenversicherung/online-ratgeber-krankenversicherung/staerkung-der-patientenrechte',
			year: 2024
		},
		href: 'https://www.116117.de',
		hrefLabel: 'Open 116117.de',
		specialty: 'Ophthalmology',
		region: 'Germany'
	},
	{
		id: 'patient-derm-wait',
		audience: 'patient',
		title: 'Dermatology waits are often longer',
		body: 'Germany’s all-specialist average was about five weeks in 2024. There is no official dermatology-only national average in that survey. A Greifswald newspaper sample put skin, eye, orthopedics and lung waits between five weeks and six months — a local sample, not a registry.',
		source: {
			label: 'Ärzteblatt 2024 national average; Ostsee-Zeitung Greifswald sample',
			url: 'https://www.ostsee-zeitung.de/lokales/vorpommern-greifswald/greifswald/lange-wartezeiten-beim-facharzt-SDSUPIYNP36AVVQ2BDXKKXHLJI.html',
			year: 2024,
			note: 'Dermatology figure is regional/sample; national number is all specialists.'
		},
		href: '/patient/match',
		hrefLabel: 'Match a dermatologist',
		specialty: 'Dermatology',
		region: 'Germany'
	},
	{
		id: 'patient-mv-tss',
		audience: 'patient',
		title: '116117 in Mecklenburg-Vorpommern',
		body: 'KVMV reports arranging about 89% of TSS requests within the four-week deadline. In 2023 the MV hotline averaged about 260 calls a day. KBV notes that MV does not fully run the national 116117 online booking service — phone and the KVMV form still matter here.',
		source: {
			label: 'Nordkurier interview with KVMV; KBV TSS 2024 (MV coverage note)',
			url: 'https://www.nordkurier.de/regional/mecklenburg-vorpommern/taeglich-260-anrufe-bei-der-terminservicestelle-so-finden-sie-einen-arzt-2723634',
			year: 2023,
			note: 'KVMV figure as reported in regional press; 260 calls/day is 2023.'
		},
		href: 'https://www.kvmv.de/patienten/patienteninformationen/tss/',
		hrefLabel: 'KVMV appointment desk',
		region: 'MV',
		when: 'always'
	},
	{
		id: 'patient-greifswald-sample',
		audience: 'patient',
		title: 'Greifswald: no official wait-time statistic',
		body: 'A local Ostsee-Zeitung sample found waits of five weeks to six months for ophthalmology, dermatology, orthopedics and pulmonology. KV MV says Greifswald / former Ostvorpommern has no new specialist seats under national planning — and that nobody keeps an official wait-time register for the city.',
		source: {
			label: 'Ostsee-Zeitung Greifswald (local sample + KVMV quote)',
			url: 'https://www.ostsee-zeitung.de/lokales/vorpommern-greifswald/greifswald/lange-wartezeiten-beim-facharzt-SDSUPIYNP36AVVQ2BDXKKXHLJI.html',
			year: 2017,
			note: 'Local sample and planning quote — not a current census of waits.'
		},
		href: '/patient/match',
		hrefLabel: 'See Greifswald matches',
		region: 'Greifswald'
	},
	{
		id: 'patient-oecd-gp',
		audience: 'patient',
		title: 'About one in five wait over a week for a GP',
		body: 'OECD figures reported for 2023 put Germany among countries where about 20% of patients wait more than a week to see a GP or nurse (26% if six-to-seven-day waits are counted). If you already have a visit booked here, you are ahead of that queue.',
		source: {
			label: 'Euronews reporting of OECD waiting-time figures',
			url: 'https://www.euronews.com/health/2026/06/03/waiting-times-for-healthcare-in-europe-the-worst-countries-ranked',
			year: 2023,
			note: 'OECD comparison; methods differ by country.'
		},
		href: '/patient/match',
		hrefLabel: 'Match a GP',
		specialty: 'General Practitioner',
		region: 'Germany'
	},
	{
		id: 'patient-online-book',
		audience: 'patient',
		title: 'Half of adults book doctors online',
		body: 'In late 2024, 50% of people in Germany aged 16+ had booked a doctor visit online (36% a year earlier). 39% had used platforms such as Doctolib, jameda or Clickdoc. We cannot import those calendars — save the apps you use so we can open them.',
		source: {
			label: 'Bitkom Research (n=1,007, Oct 2024)',
			url: 'https://bitkom-research.de/news/die-haelfte-der-deutschen-vereinbart-arzttermine-online',
			year: 2024
		},
		href: '/patient/systems',
		hrefLabel: 'Your booking apps',
		region: 'Germany',
		when: 'always'
	},
	{
		id: 'patient-external-gap',
		audience: 'patient',
		title: 'Doctolib & other apps are not synced',
		body: 'YourHealthMatch keeps local and demo appointments only. Visits that exist solely on Doctolib, Doctena, arzt-direkt or CGM/Clickdoc do not appear here. If a practice you booked here also lists one of those channels, we can still open that app — we still do not read its calendar.',
		href: '/patient/systems',
		hrefLabel: 'Open saved systems',
		when: 'always'
	},
	{
		id: 'patient-external-linked',
		audience: 'patient',
		title: 'This visit is linked to an external booker',
		body: 'At least one of your upcoming visits is at a practice that also uses Doctolib, Doctena, arzt-direkt or CGM. Treat that channel as a shortcut, not a second source of truth — we have not imported any extra appointments from it.',
		href: '/patient/systems',
		hrefLabel: 'Open booking apps',
		externalLinked: true
	},
	{
		id: 'patient-waitlist',
		audience: 'patient',
		title: 'No visit yet? Join the waitlist',
		body: 'If matching finds no practice, you can leave an email on the waitlist. That is local interest data (and optional notify-when-a-slot-opens) — not a 116117 booking.',
		href: '/patient/match',
		hrefLabel: 'Match or waitlist',
		when: 'no_appointment'
	},
	{
		id: 'patient-gesund-bund',
		audience: 'patient',
		title: 'Official health information',
		body: 'gesund.bund.de is the federal public health portal (conditions, rights, and navigation). Use it for background — not as a substitute for the visit you already booked.',
		href: 'https://gesund.bund.de',
		hrefLabel: 'Open gesund.bund.de',
		region: 'Germany',
		when: 'always'
	},
	{
		id: 'patient-video-share',
		audience: 'patient',
		title: 'Video visits are still a small slice of care',
		body: 'GKV practices documented 2.7 million video consultations in 2024 (up 24.8% from 2023) versus 579 million treatment cases overall — video remains well under 1% of cases. If your booked visit is video, join from this dashboard when it is confirmed.',
		source: {
			label: 'Zi-Trendreport / Zentralinstitut (GKV billing)',
			url: 'https://www.zi.de/das-zi/medien/medieninformationen-und-statements/detailansicht/anzahl-der-videosprechstunden-auf-27-millionen-gestiegen-gesamtfallzahl-2024-mit-579-millionen-leicht-ueber-hohem-vorjahresniveau-zum-teil-deutliches-plus-bei-frueherkennungsuntersuchungen',
			year: 2024
		},
		region: 'Germany'
	},

	// —— Doctor: clinic operations facts ——
	{
		id: 'doctor-noshow-kbv',
		audience: 'doctor',
		title: 'No-shows are common — and uneven',
		body: 'In a 2023 KBV online survey of more than 2,000 practices, 70% reported problems with unexcused no-shows. Among those, more than 40% put missed visits at 5–10% of appointments; 16% said 10–20%. Self-selected survey, not a census — still a planning risk for published slots.',
		source: {
			label: 'KBV practice survey, reported by zm-online',
			url: 'https://www.zm-online.de/news/detail/arztpraxen-beklagen-hohe-zahl-nicht-abgesagter-termine',
			year: 2023,
			note: 'Self-selected online survey (June 2023).'
		},
		href: '/doctor/schedule',
		hrefLabel: 'Review today’s schedule',
		region: 'Germany'
	},
	{
		id: 'doctor-noshow-tss-ophtho',
		audience: 'doctor',
		title: 'TSS no-shows can run higher',
		body: 'KV Bremen matched TSS referrals to claims (Q1 2021–Q2 2022) and found about 21% no-shows overall; ophthalmology was 26% in that sample. Regional and TSS-only — not MV — but a reminder to confirm visits you did not originate.',
		source: {
			label: 'KV Bremen TSS no-show analysis',
			url: 'https://www.kvhb.de/praxen/nachrichten/detail/21-prozent-no-shows-bei-tss-terminen-was-jetzt-getan-werden-muss',
			year: 2022,
			note: 'Bremen sample, TSS-arranged visits only.'
		},
		href: '/doctor/schedule',
		hrefLabel: 'Confirm requested visits',
		specialty: 'Ophthalmology',
		region: 'Germany'
	},
	{
		id: 'doctor-noshow-tss-derm',
		audience: 'doctor',
		title: 'Dermatology TSS no-shows (regional sample)',
		body: 'The same KV Bremen TSS sample put dermatology no-shows at about 20% (813 mediated visits). Treat as a regional TSS figure, not a national dermatology rate.',
		source: {
			label: 'KV Bremen TSS no-show analysis',
			url: 'https://www.kvhb.de/praxen/nachrichten/detail/21-prozent-no-shows-bei-tss-terminen-was-jetzt-getan-werden-muss',
			year: 2022,
			note: 'Bremen sample, TSS-arranged visits only.'
		},
		href: '/doctor/schedule',
		hrefLabel: 'Confirm requested visits',
		specialty: 'Dermatology',
		region: 'Germany'
	},
	{
		id: 'doctor-tss-cancel',
		audience: 'doctor',
		title: 'About 9% of 116117 bookings are cancelled',
		body: 'In 2024, about 9% of 116117 bookings were cancelled after the fact (8.3% by patients, 0.9% by practices). That is cancellation, not silent no-show. Publishing fewer, better-fit slots still beats empty TSS inventory.',
		source: {
			label: 'KBV Evaluationsbericht 116117-Terminservice 2024',
			url: 'https://www.kbv.de/documents/infothek/zahlen-und-fakten/evaluationsberichte-tss/bericht-116117-terminservicestellen-2024.pdf',
			year: 2024
		},
		href: 'https://www.116117.de',
		hrefLabel: '116117 for practices',
		region: 'Germany'
	},
	{
		id: 'doctor-publish-slots',
		audience: 'doctor',
		title: 'Published slots get used',
		body: 'Bitkom (2024): 50% of adults have booked a doctor online; 88% say practices are hard to reach by phone; 75% want every practice to offer internet booking. On 116117, 53% of offered slots were booked in 2024 (44% in 2023). Opening times here is the local equivalent.',
		source: {
			label: 'Bitkom Research 2024; KBV TSS booking rate 2024',
			url: 'https://bitkom-research.de/news/die-haelfte-der-deutschen-vereinbart-arzttermine-online',
			year: 2024
		},
		href: '/doctor/schedule',
		hrefLabel: 'Publish open times',
		region: 'Germany'
	},
	{
		id: 'doctor-tss-demand',
		audience: 'doctor',
		title: 'Where 116117 demand sits',
		body: 'In 2024 almost half of 116117 search volume was psychotherapy (~30%), radiology (~11%) and neurology/psychiatry (~8%). GP and ophthalmology are also searched often. National mix — your Greifswald panel may differ.',
		source: {
			label: 'KBV Evaluationsbericht 116117-Terminservice 2024',
			url: 'https://www.kbv.de/documents/infothek/zahlen-und-fakten/evaluationsberichte-tss/bericht-116117-terminservicestellen-2024.pdf',
			year: 2024,
			note: 'National TSS search mix, not MV panel demand.'
		},
		href: '/doctor/practice',
		hrefLabel: 'Update specialties',
		region: 'Germany'
	},
	{
		id: 'doctor-video-mix',
		audience: 'doctor',
		title: 'Video vs in-person in GKV care',
		body: '2.7 million video consultations in 2024 (+24.8% vs 2023): 50.1% GP, 34.2% psychotherapy, 15.7% other specialties. Against 579 million GKV cases that is still well under 1%. On 116117, video was only 0.2% of offered slots — mostly GP, then ophthalmology (~10% of those video bookings).',
		source: {
			label: 'Zi-Trendreport 2024; KBV TSS 2024 (video slot share)',
			url: 'https://www.zi.de/das-zi/medien/medieninformationen-und-statements/detailansicht/anzahl-der-videosprechstunden-auf-27-millionen-gestiegen-gesamtfallzahl-2024-mit-579-millionen-leicht-ueber-hohem-vorjahresniveau-zum-teil-deutliches-plus-bei-frueherkennungsuntersuchungen',
			year: 2024
		},
		href: '/doctor/practice',
		hrefLabel: 'Set visit modalities',
		region: 'Germany'
	},
	{
		id: 'doctor-language',
		audience: 'doctor',
		title: 'Language is a demand signal',
		body: 'Destatis figures reported for 2023: about 15% of people in Germany do not primarily speak German at home. Interpreting is generally not paid by GKV. Listing English, Arabic or other languages on your profile is how patients in this app find you.',
		source: {
			label: 'Destatis (via Deutsche Welle)',
			url: 'https://www.dw.com/en/germanys-health-care-system-has-a-language-problem/a-70652431',
			year: 2023,
			note: 'DW citing Destatis; not a billing statistic.'
		},
		href: '/doctor/practice',
		hrefLabel: 'Edit practice languages',
		region: 'Germany',
		when: 'always'
	},
	{
		id: 'doctor-new-patients',
		audience: 'doctor',
		title: 'New-patient demand is the bottleneck',
		body: 'National specialist waits averaged about five weeks in 2024. Matching in this app only offers practices that are marked as accepting new patients. If the panel is closed, waitlist interest still collects locally — we do not send it to 116117.',
		source: {
			label: 'Deutsches Ärzteblatt (BMG survey, 2024 waits)',
			url: 'https://www.aerzteblatt.de/news/gesetzlich-versicherte-warten-im-schnitt-funf-wochen-auf-facharzttermin-b2b64c64-4546-4775-a6fe-91b31e296bd8',
			year: 2024
		},
		href: '/doctor/practice',
		hrefLabel: 'New-patient setting',
		region: 'Germany',
		when: 'always'
	},
	{
		id: 'doctor-mv-tss',
		audience: 'doctor',
		title: 'MV TSS still phones practices',
		body: 'KVMV’s chair has said practices rarely push spare slots to the TSS, so staff call around — and still report ~89% of requests placed within four weeks. Opening bookable times here (and on 116117 where you participate) reduces those chase calls.',
		source: {
			label: 'Nordkurier / KVMV',
			url: 'https://www.nordkurier.de/regional/mecklenburg-vorpommern/taeglich-260-anrufe-bei-der-terminservicestelle-so-finden-sie-einen-arzt-2723634',
			year: 2023
		},
		href: '/doctor/schedule',
		hrefLabel: 'Open times this week',
		region: 'MV'
	},
	{
		id: 'doctor-external-gap',
		audience: 'doctor',
		title: 'External diaries are not imported',
		body: 'A Doctolib, Doctena, arzt-direkt or CGM channel on the practice profile is a launch shortcut for patients. It does not sync that vendor’s calendar into this queue. Seeded Davis/Doctolib visits are local records with an external channel tag — not a live Doctolib pull.',
		href: '/doctor/practice',
		hrefLabel: 'Booking channel',
		when: 'always'
	},
	{
		id: 'doctor-external-linked',
		audience: 'doctor',
		title: 'A visit is tagged to an external channel',
		body: 'At least one upcoming visit is at a practice profile that lists Doctolib, Doctena, arzt-direkt or CGM. Confirm it here as usual; we still cannot see other appointments that exist only in that vendor’s product.',
		href: '/doctor/schedule',
		hrefLabel: 'Open schedule',
		externalLinked: true
	},
	{
		id: 'doctor-empty-publish',
		audience: 'doctor',
		title: 'No visits yet — publish a few slots',
		body: 'Bitkom found 27% of online bookers pick a practice because it offers internet booking. Opening even a handful of times on the schedule is how demo patients (and later, real ones) can request a visit.',
		source: {
			label: 'Bitkom Research 2024',
			url: 'https://bitkom-research.de/news/die-haelfte-der-deutschen-vereinbart-arzttermine-online',
			year: 2024
		},
		href: '/doctor/schedule',
		hrefLabel: 'Publish open times',
		when: 'no_appointment'
	}
];
