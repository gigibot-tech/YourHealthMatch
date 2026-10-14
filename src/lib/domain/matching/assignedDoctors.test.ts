import { describe, expect, it } from 'vitest';
import { assignedForSpecialty, upsertAssignedDoctor } from './assignedDoctors';

describe('Stammärzte', () => {
	it('saves one doctor per specialty and replaces on rebook', () => {
		const first = upsertAssignedDoctor([], {
			specialty: 'Dermatology',
			practiceId: 'prac_a',
			doctorId: 'doc_a'
		});
		const next = upsertAssignedDoctor(first, {
			specialty: 'Dermatology',
			practiceId: 'prac_b',
			doctorId: 'doc_b'
		});
		expect(assignedForSpecialty(next, 'Dermatology')).toEqual({
			specialty: 'Dermatology',
			practiceId: 'prac_b',
			doctorId: 'doc_b'
		});
		expect(next).toHaveLength(1);
	});
});
