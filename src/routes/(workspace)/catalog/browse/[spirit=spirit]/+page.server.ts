import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

// spirit drill-downs moved to /catalog/explore/[spirit]. preserve query string.
export const load: PageServerLoad = ({ params, url }) => {
	redirect(308, `/catalog/explore/${params.spirit}${url.search}`);
};
