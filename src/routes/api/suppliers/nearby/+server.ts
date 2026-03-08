import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { searchNearbyStores } from '$lib/server/places';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || !locals.activeWorkspaceId) {
		error(StatusCodes.UNAUTHORIZED, { reason: 'Unauthorized', code: StatusCodes.UNAUTHORIZED, message: 'Login required' });
	}

	const lat = Number(url.searchParams.get('lat'));
	const lng = Number(url.searchParams.get('lng'));

	if (isNaN(lat) || isNaN(lng)) {
		error(StatusCodes.BAD_REQUEST, { reason: 'Bad Request', code: StatusCodes.BAD_REQUEST, message: 'lat and lng are required' });
	}

	const radius = Number(url.searchParams.get('radius')) || 5000;

	try {
		const places = await searchNearbyStores(lat, lng, radius);
		return json(places);
	} catch (err: any) {
		console.error('Nearby stores search failed:', err);
		error(StatusCodes.INTERNAL_SERVER_ERROR, { reason: 'Server Error', code: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Failed to search nearby stores' });
	}
};
