import { normalizeLanguageCode, type LanguageCode } from '$lib/domain/languages';
import { MESSAGES, type MessageKey } from './messages';

export type { MessageKey };

export function uiLanguage(raw: string | undefined | null): LanguageCode {
	return normalizeLanguageCode(raw || '') || 'EN';
}

export function t(lang: LanguageCode, key: MessageKey): string {
	return MESSAGES[lang][key] ?? MESSAGES.EN[key];
}

export function greetingKey(now = new Date()): MessageKey {
	const h = now.getHours();
	if (h < 12) return 'greet.morning';
	if (h < 17) return 'greet.afternoon';
	return 'greet.evening';
}
