import { describe, expect, it } from 'vitest';
import { LANGUAGE_CODES } from '$lib/domain/languages';
import { MESSAGES, type MessageKey } from './messages';
import { t, uiLanguage } from './index';

describe('interface language', () => {
	it('translates a visible label for every registered language', () => {
		for (const code of LANGUAGE_CODES) {
			expect(t(code, 'nav.dashboard').length).toBeGreaterThan(0);
			expect(t(code, 'symptom.vision')).not.toBe('');
		}
		expect(t('DE', 'nav.dashboard')).not.toBe(t('EN', 'nav.dashboard'));
		expect(t('AR', 'match.title')).not.toBe(t('EN', 'match.title'));
	});

	it('covers the same keys in every language', () => {
		const keys = Object.keys(MESSAGES.EN) as MessageKey[];
		for (const code of LANGUAGE_CODES) {
			expect(Object.keys(MESSAGES[code]).sort()).toEqual([...keys].sort());
		}
	});

	it('falls back to English for an empty preference', () => {
		expect(uiLanguage('')).toBe('EN');
		expect(uiLanguage('Deutsch')).toBe('DE');
	});
});
