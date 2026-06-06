import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

// /catalog/browse was moved to /catalog. preserve query string for old links.
export const load: PageServerLoad = ({ url }) => {
	redirect(308, `/catalog${url.search}`);
};
