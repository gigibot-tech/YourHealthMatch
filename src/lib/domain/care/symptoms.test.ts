import { describe, expect, it } from 'vitest';
import { leadFromPhrase, resolveLead, SYMPTOMS } from './symptoms';

describe('lead symptoms', () => {
	it('keeps three closed leads with default modalities', () => {
		expect(SYMPTOMS.map((s) => s.id)).toEqual(['unwell', 'vision', 'skin']);
		expect(SYMPTOMS.find((s) => s.id === 'skin')?.defaultModality).toBe('video');
		expect(SYMPTOMS.find((s) => s.id === 'vision')?.defaultModality).toBe('in_person');
		expect(SYMPTOMS.find((s) => s.id === 'unwell')?.defaultModality).toBe('in_person');
	});

	it('maps phrase keywords to a lead id only', () => {
		expect(leadFromPhrase('itchy rash on arm')).toBe('skin');
		expect(leadFromPhrase('blurred vision')).toBe('vision');
		expect(leadFromPhrase('')).toBe('unwell');
		expect(leadFromPhrase('feeling tired')).toBe('unwell');
	});

	it('resolveLead prefers an explicit lead tap over the phrase', () => {
		expect(resolveLead({ leadId: 'vision', phrase: 'rash' }).id).toBe('vision');
		expect(resolveLead({ phrase: 'mole' }).specialty).toBe('Dermatology');
	});
});
