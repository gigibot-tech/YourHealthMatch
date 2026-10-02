/**
 * Matching-facing language helpers — thin re-export of the app language catalog.
 * Prefer `$lib/domain/languages` for new UI / registration code.
 */
export {
	LANGUAGE_CODES as MATCH_LANGUAGE_CODES,
	registrationLanguageOptions as MATCH_LANGUAGE_OPTIONS,
	normalizeLanguageCode,
	languageLabel,
	practiceSpeaksLanguage,
	type LanguageCode as MatchLanguageCode
} from '../languages';
