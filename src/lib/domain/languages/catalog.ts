/**
 * App language catalog — SSOT for multilingual registration and matching.
 *
 * Phase 1 registration languages: UK, AR, TR, RU, EN, DE (UK = Ukrainian, ISO 639-1).
 * Extend by appending to LANGUAGES; set `registration: false` to hide from signup
 * without removing matching aliases.
 */

export type LanguageCode = 'UK' | 'AR' | 'TR' | 'RU' | 'EN' | 'DE';

export type LanguageDefinition = {
	/** Stable storage / API code */
	code: LanguageCode;
	/** English UI label */
	label: string;
	/** Native / endonym for registration UI */
	nativeLabel: string;
	/** BCP 47 tag for future UI locale / Intl */
	bcp47: string;
	/** Shown in patient registration / profile language picker */
	registration: boolean;
	/** Extra labels that normalize to this code (legacy storage, free text) */
	aliases: string[];
};

/**
 * Canonical catalog. Add a row here to support a new language long-term.
 * Do not scatter language lists in routes or matching.
 */
export const LANGUAGES: readonly LanguageDefinition[] = [
	{
		code: 'EN',
		label: 'English',
		nativeLabel: 'English',
		bcp47: 'en',
		registration: true,
		aliases: ['english', 'en']
	},
	{
		code: 'DE',
		label: 'German',
		nativeLabel: 'Deutsch',
		bcp47: 'de',
		registration: true,
		aliases: ['german', 'deutsch', 'de']
	},
	{
		code: 'AR',
		label: 'Arabic',
		nativeLabel: 'العربية',
		bcp47: 'ar',
		registration: true,
		aliases: ['arabic', 'ar']
	},
	{
		code: 'TR',
		label: 'Turkish',
		nativeLabel: 'Türkçe',
		bcp47: 'tr',
		registration: true,
		aliases: ['turkish', 'tr', 'türkçe', 'turkce']
	},
	{
		code: 'RU',
		label: 'Russian',
		nativeLabel: 'Русский',
		bcp47: 'ru',
		registration: true,
		aliases: ['russian', 'ru', 'русский']
	},
	{
		code: 'UK',
		label: 'Ukrainian',
		nativeLabel: 'Українська',
		bcp47: 'uk',
		registration: true,
		aliases: ['ukrainian', 'uk', 'українська']
	}
] as const;

export const LANGUAGE_CODES: readonly LanguageCode[] = LANGUAGES.map((l) => l.code);

const BY_CODE = new Map<string, LanguageDefinition>(
	LANGUAGES.map((l) => [l.code, l])
);

const ALIAS_TO_CODE = new Map<string, LanguageCode>();
for (const lang of LANGUAGES) {
	ALIAS_TO_CODE.set(lang.code.toLowerCase(), lang.code);
	ALIAS_TO_CODE.set(lang.label.toLowerCase(), lang.code);
	ALIAS_TO_CODE.set(lang.nativeLabel.toLowerCase(), lang.code);
	ALIAS_TO_CODE.set(lang.bcp47.toLowerCase(), lang.code);
	for (const alias of lang.aliases) {
		ALIAS_TO_CODE.set(alias.toLowerCase(), lang.code);
	}
}

/** Languages offered at registration / profile (Mehrsprachige Registrierung). */
export function registrationLanguages(): LanguageDefinition[] {
	return LANGUAGES.filter((l) => l.registration);
}

/** Select options: value = code, label for display. */
export function registrationLanguageOptions(): { code: LanguageCode; label: string }[] {
	return registrationLanguages().map((l) => ({
		code: l.code,
		label: `${l.label} (${l.nativeLabel})`
	}));
}

export function getLanguage(code: string): LanguageDefinition | undefined {
	const normalized = normalizeLanguageCode(code);
	return normalized ? BY_CODE.get(normalized) : undefined;
}

/** Map free-text, legacy label, or code → catalog code. */
export function normalizeLanguageCode(raw: string): LanguageCode | null {
	const key = raw.trim().toLowerCase();
	if (!key) return null;
	return ALIAS_TO_CODE.get(key) ?? null;
}

export function languageLabel(code: string): string {
	const def = getLanguage(code);
	return def?.label ?? code;
}

export function languageNativeLabel(code: string): string {
	const def = getLanguage(code);
	return def?.nativeLabel ?? code;
}

/** True when any practice language entry matches the patient's preferred code. */
export function practiceSpeaksLanguage(
	practiceLanguages: string[],
	patientLanguage: string
): boolean {
	const want = normalizeLanguageCode(patientLanguage);
	if (!want) return false;
	return practiceLanguages.some((lang) => normalizeLanguageCode(lang) === want);
}

/** Normalize a comma-separated practice languages field to codes (drop unknowns). */
export function normalizeLanguageList(raw: string[] | string): LanguageCode[] {
	const parts = Array.isArray(raw)
		? raw
		: raw.split(/[,;/|]/).map((s) => s.trim()).filter(Boolean);
	const out: LanguageCode[] = [];
	for (const part of parts) {
		const code = normalizeLanguageCode(part);
		if (code && !out.includes(code)) out.push(code);
	}
	return out;
}
