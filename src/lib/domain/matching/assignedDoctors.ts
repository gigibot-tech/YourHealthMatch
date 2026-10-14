/**
 * Saved doctor per specialty on the patient profile ("Stammärzte").
 */
export type AssignedDoctor = {
	specialty: string;
	practiceId: string;
	doctorId: string;
};

export function upsertAssignedDoctor(
	list: AssignedDoctor[],
	entry: AssignedDoctor
): AssignedDoctor[] {
	const next = list.filter(
		(a) => a.specialty.trim().toLowerCase() !== entry.specialty.trim().toLowerCase()
	);
	next.push(entry);
	return next;
}

export function assignedForSpecialty(
	list: AssignedDoctor[],
	specialty: string
): AssignedDoctor | null {
	const want = specialty.trim().toLowerCase();
	return list.find((a) => a.specialty.trim().toLowerCase() === want) ?? null;
}
