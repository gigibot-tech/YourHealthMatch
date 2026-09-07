import type { Interest } from '$lib/domain/interest/interest';
import { API_PATHS, postJson } from './httpApi';

/** Optional remote sync. Local waitlist stays canonical; failures are ignored. */
export async function syncInterestRemote(interest: Interest): Promise<void> {
	try {
		await postJson(API_PATHS.interest, interest);
	} catch {
		/* offline / Tauri without VITE_API_BASE / local ok */
	}
}
