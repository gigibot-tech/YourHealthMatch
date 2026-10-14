import { describe, expect, it } from 'vitest';
import {
	parsePreferredWindow,
	serializePreferredWindow,
	timeInPreferredWindow
} from './timeWindows';

describe('patient time bands', () => {
	it('parses any when empty', () => {
		expect(parsePreferredWindow('')).toEqual(['any']);
		expect(parsePreferredWindow('morning,evening')).toEqual(['morning', 'evening']);
	});

	it('serializes any when any is selected', () => {
		expect(serializePreferredWindow(['any', 'morning'])).toBe('any');
		expect(serializePreferredWindow(['lunch', 'evening'])).toBe('lunch,evening');
	});

	it('filters slot times against chosen bands', () => {
		expect(timeInPreferredWindow('08:30', 'morning')).toBe(true);
		expect(timeInPreferredWindow('09:00', 'morning')).toBe(false);
		expect(timeInPreferredWindow('12:30', 'lunch')).toBe(true);
		expect(timeInPreferredWindow('17:00', 'evening')).toBe(true);
		expect(timeInPreferredWindow('16:00', 'evening')).toBe(false);
		expect(timeInPreferredWindow('11:00', 'any')).toBe(true);
		expect(timeInPreferredWindow('08:00', 'morning,evening')).toBe(true);
	});
});
