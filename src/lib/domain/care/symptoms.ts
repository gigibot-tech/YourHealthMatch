/**
 * What the patient says, mapped to the specialty the matcher already uses.
 * The specialty stays off the screen.
 */

export type Symptom = {
	id: string;
	label: string;
	specialty: string;
};

export const SYMPTOMS: readonly Symptom[] = [
	{
		id: 'unwell',
		label: 'Feeling unwell, or due a checkup',
		specialty: 'General Practitioner'
	},
	{
		id: 'vision',
		label: 'Blurred vision or eye trouble',
		specialty: 'Ophthalmology'
	},
	{
		id: 'skin',
		label: 'A rash, an itch, or a mole to check',
		specialty: 'Dermatology'
	}
];
