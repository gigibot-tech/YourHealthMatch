/**
 * Lead symptoms → specialty. Phrase keywords only pick a lead id.
 * Never invents a Fachrichtung. No model call.
 */
export type VisitModalityDefault = 'in_person' | 'video';

export type Symptom = {
	id: string;
	label: string;
	specialty: string;
	/** Suggested visit form; the patient can override before matching. */
	defaultModality: VisitModalityDefault;
};

export const SYMPTOMS: readonly Symptom[] = [
	{
		id: 'unwell',
		label: 'Feeling unwell, or due a checkup',
		specialty: 'General Practitioner',
		defaultModality: 'in_person'
	},
	{
		id: 'vision',
		label: 'Blurred vision or eye trouble',
		specialty: 'Ophthalmology',
		defaultModality: 'in_person'
	},
	{
		id: 'skin',
		label: 'A rash, an itch, or a mole to check',
		specialty: 'Dermatology',
		defaultModality: 'video'
	}
];

const SKIN_WORDS = ['rash', 'itch', 'mole', 'skin', 'haut', 'ausschlag'];
const EYE_WORDS = ['eye', 'blur', 'vision', 'sight', 'auge', 'sehen'];

export function symptomById(id: string): Symptom | undefined {
	return SYMPTOMS.find((s) => s.id === id);
}

/** Map a short phrase to a lead id. Empty or unknown → checkup. */
export function leadFromPhrase(phrase: string): string {
	const text = phrase.trim().toLowerCase();
	if (!text) return 'unwell';
	if (SKIN_WORDS.some((w) => text.includes(w))) return 'skin';
	if (EYE_WORDS.some((w) => text.includes(w))) return 'vision';
	return 'unwell';
}

export function resolveLead(input: { phrase?: string; leadId?: string }): Symptom {
	const fromPhrase = input.phrase?.trim() ? leadFromPhrase(input.phrase) : null;
	const id = input.leadId || fromPhrase || 'unwell';
	return symptomById(id) ?? SYMPTOMS[0];
}
