import { API_PATHS, postJson } from './httpApi';
import type { Interest } from '$lib/domain/interest/interest';
import { CONTACT_EMAIL } from '$lib/domain/externalSystems/catalog';

export type MatchInterestDelivery = 'emailed' | 'stored' | 'failed';

/** Team inbox plus the wired Supabase project, when that API answers. */
export async function deliverMatchInterest(
	interest: Interest,
	symptomLabel: string
): Promise<MatchInterestDelivery> {
	const payload = { ...interest, symptomLabel, notify: CONTACT_EMAIL };
	const [stored, emailed] = await Promise.all([
		storeInSupabase(payload),
		postInterestApi(payload)
	]);
	if (emailed) return 'emailed';
	if (stored) return 'stored';
	return 'failed';
}

async function storeInSupabase(payload: Interest & { symptomLabel: string; notify: string }): Promise<boolean> {
	const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
	const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
	if (!base || !key) return false;
	try {
		const response = await fetch(`${base}/rest/v1/match_interest`, {
			method: 'POST',
			headers: {
				apikey: key,
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json',
				Prefer: 'return=minimal'
			},
			body: JSON.stringify({
				email: payload.email,
				symptom_id: payload.symptomId,
				symptom_label: payload.symptomLabel,
				language: payload.requirements.language,
				location: payload.requirements.location || payload.requirements.city,
				postcode: payload.requirements.postcode,
				insurance: payload.requirements.insurance,
				krankenkasse: payload.requirements.krankenkasse,
				new_patient: payload.requirements.newPatient,
				modality: payload.requirements.modality,
				preferred_window: payload.requirements.preferredWindow,
				notify: payload.notify
			})
		});
		return response.ok || response.status === 409;
	} catch {
		return false;
	}
}

async function postInterestApi(payload: Interest & { symptomLabel: string; notify: string }): Promise<boolean> {
	try {
		const body = (await postJson(API_PATHS.interest, payload)) as { emailed?: boolean };
		return body?.emailed === true;
	} catch {
		return false;
	}
}
