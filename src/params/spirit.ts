import type { ParamMatcher } from '@sveltejs/kit';
import { validSlugs } from '$lib/spirits';

export const match: ParamMatcher = (param) => {
	return validSlugs.includes(param as any);
};
