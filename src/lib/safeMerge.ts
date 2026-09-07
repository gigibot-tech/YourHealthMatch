/**
 * JSON-safe merge: plain objects only; undefined patch keys are skipped (don't erase).
 * Arrays and primitives replace; nested plain objects merge recursively.
 */
export function safeMerge<T extends object>(base: T, patch: Partial<T>): T {
	const out = { ...base } as T;
	for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
		if (v === undefined) continue;
		const key = k as keyof T;
		const baseVal = (base as Record<string, unknown>)[k];
		if (
			v !== null &&
			typeof v === 'object' &&
			!Array.isArray(v) &&
			baseVal !== null &&
			typeof baseVal === 'object' &&
			!Array.isArray(baseVal)
		) {
			(out as Record<string, unknown>)[k] = safeMerge(
				(baseVal as object) ?? {},
				v as object
			);
		} else {
			(out as Record<string, unknown>)[k] = v;
		}
	}
	return out;
}

/** After merge — what's still missing for a required-key list? */
export function missingRequired(obj: object, keys: readonly string[]): string[] {
	return keys.filter((k) => {
		const v = (obj as Record<string, unknown>)[k];
		if (v === undefined || v === null || v === '') return true;
		if (Array.isArray(v) && v.length === 0) return true;
		return false;
	});
}
