import { describe, expect, it } from 'vitest';
import {
	FACT_CARDS,
	regionTags,
	selectFacts,
	specialtyMatches,
	type FactCard
} from './factCards';

const greifswald = {
	location: 'Greifswald',
	city: 'Greifswald',
	postcode: '17489'
};

describe('regionTags', () => {
	it('tags Greifswald 17489 as city + MV + Germany', () => {
		expect(regionTags(greifswald)).toEqual(['Germany', 'MV', 'Greifswald']);
	});

	it('tags Berlin as Germany only', () => {
		expect(regionTags({ location: 'Berlin', city: 'Berlin', postcode: '10115' })).toEqual([
			'Germany'
		]);
	});

	it('tags MV postcodes without city name', () => {
		expect(regionTags({ postcode: '18055' })).toContain('MV');
		expect(regionTags({ postcode: '18055' })).not.toContain('Greifswald');
	});
});

describe('specialtyMatches', () => {
	it('matches ophthalmology aliases and ignores dermatology', () => {
		expect(specialtyMatches('Ophthalmology', ['Ophthalmology'])).toBe(true);
		expect(specialtyMatches('Ophthalmology', ['Eye'])).toBe(true);
		expect(specialtyMatches('Dermatology', ['Ophthalmology'])).toBe(false);
		expect(specialtyMatches(undefined, ['Ophthalmology'])).toBe(true);
		expect(specialtyMatches('Dermatology', [])).toBe(false);
	});
});

describe('selectFacts', () => {
	it('filters by role', () => {
		const patient = selectFacts({
			audience: 'patient',
			hasAppointment: true,
			specialties: ['Ophthalmology'],
			...greifswald
		});
		const doctor = selectFacts({
			audience: 'doctor',
			hasAppointment: true,
			specialties: ['Ophthalmology'],
			...greifswald
		});
		expect(patient.every((c) => c.audience === 'patient')).toBe(true);
		expect(doctor.every((c) => c.audience === 'doctor')).toBe(true);
		expect(patient.some((c) => c.id === 'patient-de-specialist-wait')).toBe(true);
		expect(doctor.some((c) => c.id === 'doctor-noshow-kbv')).toBe(true);
		expect(patient.some((c) => c.audience === 'doctor')).toBe(false);
	});

	it('ranks ophthalmology + Greifswald cards when the patient has an appointment', () => {
		const ids = selectFacts({
			audience: 'patient',
			hasAppointment: true,
			specialties: ['Ophthalmology'],
			...greifswald
		}).map((c) => c.id);
		expect(ids).toContain('patient-ophtho-116117');
		expect(ids).toContain('patient-greifswald-sample');
		expect(ids).toContain('patient-mv-tss');
		expect(ids).toContain('patient-de-specialist-wait');
		expect(ids).not.toContain('patient-derm-wait');
		expect(ids).not.toContain('patient-waitlist');
		expect(ids.indexOf('patient-ophtho-116117')).toBeLessThan(ids.indexOf('patient-de-specialist-wait'));
		expect(ids.indexOf('patient-greifswald-sample')).toBeLessThan(ids.indexOf('patient-de-specialist-wait'));
	});

	it('hides appointment-only cards when there is no visit, and shows waitlist', () => {
		const ids = selectFacts({
			audience: 'patient',
			hasAppointment: false,
			specialties: ['Ophthalmology'],
			...greifswald
		}).map((c) => c.id);
		expect(ids).toContain('patient-waitlist');
		expect(ids).toContain('patient-tss-116117');
		expect(ids).toContain('patient-external-gap');
		expect(ids).not.toContain('patient-de-specialist-wait');
		expect(ids).not.toContain('patient-ophtho-116117');
	});

	it('does not show Greifswald cards for Berlin', () => {
		const ids = selectFacts({
			audience: 'patient',
			hasAppointment: true,
			specialties: ['Ophthalmology'],
			location: 'Berlin',
			city: 'Berlin',
			postcode: '10115'
		}).map((c) => c.id);
		expect(ids).toContain('patient-de-specialist-wait');
		expect(ids).not.toContain('patient-greifswald-sample');
		expect(ids).not.toContain('patient-mv-tss');
	});

	it('includes external-linked cards only when a local visit is channel-tagged', () => {
		const without = selectFacts({
			audience: 'patient',
			hasAppointment: true,
			hasExternalLinkedAppointment: false,
			specialties: ['General Practitioner'],
			...greifswald
		}).map((c) => c.id);
		const withLink = selectFacts({
			audience: 'patient',
			hasAppointment: true,
			hasExternalLinkedAppointment: true,
			specialties: ['General Practitioner'],
			...greifswald
		}).map((c) => c.id);
		expect(without).not.toContain('patient-external-linked');
		expect(withLink[0]).toBe('patient-external-linked');
		expect(withLink).toContain('patient-tss-gp-wait');
	});

	it('selects doctor specialty facts and empty-state publish card', () => {
		const busy = selectFacts({
			audience: 'doctor',
			hasAppointment: true,
			specialties: ['Dermatology'],
			...greifswald
		}).map((c) => c.id);
		expect(busy).toContain('doctor-noshow-tss-derm');
		expect(busy).not.toContain('doctor-noshow-tss-ophtho');
		expect(busy).toContain('doctor-mv-tss');
		expect(busy).not.toContain('doctor-empty-publish');

		const idle = selectFacts({
			audience: 'doctor',
			hasAppointment: false,
			specialties: ['Dermatology'],
			...greifswald
		}).map((c) => c.id);
		expect(idle).toContain('doctor-empty-publish');
		expect(idle).toContain('doctor-new-patients');
		expect(idle).not.toContain('doctor-noshow-kbv');
	});

	it('merges extraCards after the same filters', () => {
		const extra: FactCard = {
			id: 'doctor-live-waitlist',
			audience: 'doctor',
			title: 'Local waitlist',
			body: '2 signals',
			when: 'always'
		};
		const ids = selectFacts({
			audience: 'doctor',
			hasAppointment: true,
			specialties: ['Ophthalmology'],
			extraCards: [extra],
			...greifswald
		}).map((c) => c.id);
		expect(ids).toContain('doctor-live-waitlist');
	});

	it('catalog cards that cite a number include a source url and year', () => {
		const numbered = FACT_CARDS.filter((c) => /\d/.test(c.body) && c.source);
		expect(numbered.length).toBeGreaterThan(8);
		for (const card of numbered) {
			expect(card.source?.url).toMatch(/^https:\/\//);
			expect(card.source?.year).toBeGreaterThan(2015);
		}
	});
});
