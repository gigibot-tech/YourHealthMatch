import { describe, expect, it } from 'vitest';
import { missingRequired, safeMerge } from './safeMerge';

describe('safeMerge', () => {
	it('merges shallow patches without mutating base', () => {
		const base = { a: 1, b: 2 };
		const out = safeMerge(base, { b: 3 });
		expect(out).toEqual({ a: 1, b: 3 });
		expect(base).toEqual({ a: 1, b: 2 });
	});

	it('skips undefined patch keys', () => {
		const out = safeMerge({ a: 1, b: 2 }, { b: undefined });
		expect(out).toEqual({ a: 1, b: 2 });
	});

	it('deep-merges nested plain objects', () => {
		const out = safeMerge(
			{ nested: { x: 1, y: 2 }, z: 0 },
			{ nested: { y: 9 } }
		);
		expect(out).toEqual({ nested: { x: 1, y: 9 }, z: 0 });
	});

	it('replaces arrays instead of merging', () => {
		const out = safeMerge({ tags: ['a'] }, { tags: ['b', 'c'] });
		expect(out.tags).toEqual(['b', 'c']);
	});
});

describe('missingRequired', () => {
	it('reports empty string, null, undefined, empty arrays', () => {
		expect(
			missingRequired(
				{ a: '', b: null, c: undefined, d: [], e: 'ok' },
				['a', 'b', 'c', 'd', 'e']
			)
		).toEqual(['a', 'b', 'c', 'd']);
	});
});
