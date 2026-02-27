import type { ParamMatcher } from '@sveltejs/kit';

import { validProviders, type OAuthProvider } from '$lib/types';

export const match = ((param: string): param is OAuthProvider => {
	return validProviders.includes(param as OAuthProvider);
}) satisfies ParamMatcher;
