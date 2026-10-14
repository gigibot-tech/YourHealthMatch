/**
 * Local distance for in-person matching. Seeded coords + static PLZ table.
 * No geocoding API and no PostGIS.
 */

export type LatLng = { lat: number; lng: number };

/** Demo postcode centroids around Greifswald. */
export const POSTCODE_CENTROIDS: Record<string, LatLng> = {
	'17489': { lat: 54.0865, lng: 13.3923 },
	'17491': { lat: 54.095, lng: 13.41 },
	'17493': { lat: 54.07, lng: 13.37 },
	'18507': { lat: 54.31, lng: 13.09 },
	'10115': { lat: 52.532, lng: 13.384 }
};

/** Default in-person radius in kilometres. */
export const IN_PERSON_RADIUS_KM = 40;

export function haversineKm(a: LatLng, b: LatLng): number {
	const R = 6371;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

export function coordsForPostcode(postcode: string): LatLng | null {
	const plz = postcode.trim();
	return POSTCODE_CENTROIDS[plz] ?? null;
}

export function withinRadiusKm(
	a: LatLng,
	b: LatLng,
	radiusKm = IN_PERSON_RADIUS_KM
): boolean {
	return haversineKm(a, b) <= radiusKm;
}
