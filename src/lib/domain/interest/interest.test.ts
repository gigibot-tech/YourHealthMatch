import { describe, expect, it } from 'vitest';
import { aggregateDemand, buildInterest } from './interest';

describe('interest', () => {
	it('builds interest via safeMerge with requirements snapshot', () => {
		const i = buildInterest({
			email: 'a@b.com',
			intent: 'waitlist',
			betaInterest: 'maybe',
			requirements: {
				language: 'Arabic',
				specialty: 'Dermatology',
				insurance: 'GKV',
				location: 'Greifswald',
				newPatient: true,
				preferredWindow: '',
				modality: 'either',
				postcode: '17489',
				krankenkasse: 'TK',
				city: 'Greifswald'
			}
		});
		expect(i.email).toBe('a@b.com');
		expect(i.requirements.language).toBe('Arabic');
		expect(i.id).toMatch(/^int_/);
	});

	it('stores a contact-practice request note', () => {
		const i = buildInterest({
			email: 'pat@example.com',
			intent: 'contact_practice',
			practiceId: 'prac_turner',
			note: 'Please call in English'
		});
		expect(i.intent).toBe('contact_practice');
		expect(i.note).toBe('Please call in English');
		expect(i.practiceId).toBe('prac_turner');
	});

	it('aggregates demand for doctor dashboard', () => {
		const a = buildInterest({
			email: 'a@b.com',
			requirements: {
				language: 'Arabic',
				specialty: 'Dermatology',
				insurance: 'GKV',
				location: 'Greifswald',
				newPatient: true,
				preferredWindow: '',
				modality: 'either',
				postcode: '',
				krankenkasse: '',
				city: ''
			}
		});
		const b = buildInterest({
			email: 'c@d.com',
			requirements: { ...a.requirements }
		});
		const demand = aggregateDemand([a, b]);
		expect(demand[0]).toMatchObject({
			specialty: 'Dermatology',
			language: 'Arabic',
			location: 'Greifswald',
			count: 2
		});
	});
});
