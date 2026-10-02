import { describe, expect, it } from 'vitest';
import {
	LANGUAGE_CODES,
	LANGUAGES,
	languageLabel,
	normalizeLanguageCode,
	normalizeLanguageList,
	practiceSpeaksLanguage,
	registrationLanguageOptions,
	registrationLanguages
} from './catalog';

describe('language catalog', () => {
	it('registers exactly UK AR TR RU EN DE for Phase-1 signup', () => {
		expect(LANGUAGE_CODES).toEqual(['EN', 'DE', 'AR', 'TR', 'RU', 'UK']);
		expect(registrationLanguages().map((l) => l.code).sort()).toEqual(
			['AR', 'DE', 'EN', 'RU', 'TR', 'UK'].sort()
		);
		expect(registrationLanguageOptions().every((o) => o.code && o.label)).toBe(true);
	});

	it('normalizes codes, English labels, Deutsch, and native names', () => {
		expect(normalizeLanguageCode('EN')).toBe('EN');
		expect(normalizeLanguageCode('english')).toBe('EN');
		expect(normalizeLanguageCode('Deutsch')).toBe('DE');
		expect(normalizeLanguageCode('UK')).toBe('UK');
		expect(normalizeLanguageCode('Ukrainian')).toBe('UK');
		expect(normalizeLanguageCode('українська')).toBe('UK');
		expect(normalizeLanguageCode('العربية')).toBe('AR');
		expect(languageLabel('UK')).toBe('Ukrainian');
	});

	it('matches practice language lists across label and code forms', () => {
		expect(practiceSpeaksLanguage(['EN', 'DE'], 'English')).toBe(true);
		expect(practiceSpeaksLanguage(['German', 'Arabic'], 'AR')).toBe(true);
		expect(practiceSpeaksLanguage(['DE'], 'TR')).toBe(false);
	});

	it('normalizes free-text practice language fields to codes', () => {
		expect(normalizeLanguageList('English, Deutsch, Arabic')).toEqual(['EN', 'DE', 'AR']);
		expect(normalizeLanguageList(['uk', 'EN', 'en'])).toEqual(['UK', 'EN']);
	});

	it('keeps one definition per code in the catalog', () => {
		const codes = LANGUAGES.map((l) => l.code);
		expect(new Set(codes).size).toBe(codes.length);
	});
});
