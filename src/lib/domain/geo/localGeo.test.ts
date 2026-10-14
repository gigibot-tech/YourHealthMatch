import { describe, expect, it } from 'vitest';
import {
	coordsForPostcode,
	haversineKm,
	IN_PERSON_RADIUS_KM,
	withinRadiusKm
} from './localGeo';

describe('local geo', () => {
	it('looks up demo PLZ centroids', () => {
		expect(coordsForPostcode('17489')).toEqual({ lat: 54.0865, lng: 13.3923 });
		expect(coordsForPostcode('99999')).toBeNull();
	});

	it('keeps Greifswald neighbours inside the radius', () => {
		const a = coordsForPostcode('17489')!;
		const b = coordsForPostcode('17491')!;
		expect(haversineKm(a, b)).toBeLessThan(IN_PERSON_RADIUS_KM);
		expect(withinRadiusKm(a, b)).toBe(true);
	});

	it('keeps Berlin outside Greifswald radius', () => {
		const a = coordsForPostcode('17489')!;
		const b = coordsForPostcode('10115')!;
		expect(withinRadiusKm(a, b)).toBe(false);
	});
});
