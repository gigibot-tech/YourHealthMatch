const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeWaitlistEmail(value: string): string {
	return value.trim().toLowerCase();
}

export function isWaitlistEmail(value: string): boolean {
	const email = normalizeWaitlistEmail(value);
	return email.length <= 254 && EMAIL_RE.test(email);
}

export type WaitlistRole = 'test_patient' | 'clinic';
export type WaitlistJoinResult = 'joined' | 'already' | 'invalid' | 'unavailable' | 'failed';

/** Trial waitlist: test patients looking for a doctor, and clinics or doctors. */
export async function joinTestSeekerWaitlist(
	rawEmail: string,
	role: WaitlistRole
): Promise<WaitlistJoinResult> {
	const email = normalizeWaitlistEmail(rawEmail);
	if (!isWaitlistEmail(email)) return 'invalid';
	if (role !== 'test_patient' && role !== 'clinic') return 'invalid';

	const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
	const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
	if (!base || !key) return 'unavailable';

	const response = await fetch(`${base}/rest/v1/test_seekers`, {
		method: 'POST',
		headers: {
			apikey: key,
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json',
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({ email, role, source: 'landing' })
	});

	if (response.ok) return 'joined';
	if (response.status === 409) return 'already';
	return 'failed';
}
