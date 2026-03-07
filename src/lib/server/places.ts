// google places api (new) — nearby store search via REST

import type { PlaceResult } from '$lib/types';

import { getAccessToken } from './google';

export type { PlaceResult };

export async function searchNearbyStores(
	lat: number,
	lng: number,
	radius: number = 5000
): Promise<PlaceResult[]> {
	const token = await getAccessToken();

	const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			'X-Goog-FieldMask':
				'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.types,places.rating,places.currentOpeningHours',
		},
		body: JSON.stringify({
			includedTypes: ['liquor_store'],
			maxResultCount: 20,
			locationRestriction: {
				circle: {
					center: { latitude: lat, longitude: lng },
					radius,
				},
			},
		}),
	});

	if (!res.ok) {
		const err = await res.text();
		console.error('Places API error:', err);
		throw new Error(`Places API error: ${res.status}`);
	}

	const data = await res.json();
	if (!data.places) return [];

	return data.places.map((place: any) => ({
		placeId: place.id,
		name: place.displayName?.text || '',
		address: place.formattedAddress || '',
		phone: place.nationalPhoneNumber || undefined,
		website: place.websiteUri || undefined,
		types: place.types || [],
		rating: place.rating || undefined,
		openNow: place.currentOpeningHours?.openNow ?? undefined,
	}));
}
