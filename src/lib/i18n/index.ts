import { normalizeLanguageCode, type LanguageCode } from '$lib/domain/languages';
import { MESSAGES, type MessageKey } from './messages';

export type { MessageKey };

export function uiLanguage(raw: string | undefined | null): LanguageCode {
	return normalizeLanguageCode(raw || '') || 'EN';
}

export function t(lang: LanguageCode, key: MessageKey): string {
	return MESSAGES[lang][key] ?? MESSAGES.EN[key];
}

const LOCALE: Record<LanguageCode, string> = {
	EN: 'en-US',
	DE: 'de-DE',
	AR: 'ar',
	TR: 'tr-TR',
	RU: 'ru-RU',
	UK: 'uk-UA'
};

export function uiLocale(lang: LanguageCode): string {
	return LOCALE[lang];
}

export function fill(lang: LanguageCode, key: MessageKey, vars: Record<string, string>): string {
	return Object.entries(vars).reduce(
		(text, [name, value]) => text.replaceAll(`{${name}}`, value),
		t(lang, key)
	);
}

const STATUS_KEY: Record<string, MessageKey> = {
	requested: 'status.requested',
	confirmed: 'status.confirmed',
	completed: 'status.completed',
	cancelled: 'status.cancelled',
	rejected: 'status.rejected',
	no_show: 'status.no_show'
};

const SPECIALTY_KEY: Record<string, MessageKey> = {
	Ophthalmology: 'spec.eye',
	Dermatology: 'spec.skin',
	'General Practitioner': 'spec.gp',
	Dentist: 'spec.dental',
	Cardiologist: 'spec.heart'
};

const REASON_KEY: Record<string, MessageKey> = {
	'Examination for eyesight': 'reason.eyesight',
	'Annual checkup': 'reason.checkup',
	'Skin check': 'reason.skin',
	'Post-op review': 'reason.postop',
	'Vision screening': 'reason.screening'
};

export function statusText(lang: LanguageCode, status: string): string {
	const key = STATUS_KEY[status];
	return key ? t(lang, key) : status;
}

export function specialtyText(lang: LanguageCode, specialty: string): string {
	const key = SPECIALTY_KEY[specialty];
	return key ? t(lang, key) : specialty;
}

export function reasonText(lang: LanguageCode, reason: string): string {
	const key = REASON_KEY[reason];
	return key ? t(lang, key) : reason;
}

export function greetingKey(now = new Date()): MessageKey {
	const h = now.getHours();
	if (h < 12) return 'greet.morning';
	if (h < 17) return 'greet.afternoon';
	return 'greet.evening';
}
