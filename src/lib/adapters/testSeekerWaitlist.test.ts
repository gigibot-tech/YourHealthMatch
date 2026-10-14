import { describe, expect, it } from 'vitest';
import { isWaitlistEmail, normalizeWaitlistEmail } from './testSeekerWaitlist';

describe('test seeker waitlist email', () => {
	it('accepts a normal address and lowercases it', () => {
		expect(normalizeWaitlistEmail('  Ada@Example.com ')).toBe('ada@example.com');
		expect(isWaitlistEmail('Ada@Example.com')).toBe(true);
	});

	it('rejects empty and incomplete addresses', () => {
		expect(isWaitlistEmail('')).toBe(false);
		expect(isWaitlistEmail('not-an-email')).toBe(false);
		expect(isWaitlistEmail('a@b')).toBe(false);
	});
});
