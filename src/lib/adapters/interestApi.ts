import type { Interest } from '$lib/domain/interest/interest';

/** Infrastructure: optional remote sync. Failures are swallowed (local-first). */
export async function syncInterestRemote(interest: Interest): Promise<void> {
	try {
		await fetch('/api/interest', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(interest)
		});
	} catch {
		/* offline / local ok */
	}
}
