import { error, fail, redirect } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { spirits, slugToId } from '$lib/spirits';
import { catalogRepo } from '$lib/server/core';
import { hasGlobalPermission } from '$lib/server/auth';
import type { SpiritSlug } from '$lib/types';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		redirect(StatusCodes.SEE_OTHER, '/login');
	}

	const slug = params.spirit as SpiritSlug;
	const spiritContent = spirits[slug];
	const recipeCategoryId = slugToId[slug];

	// category descriptions/images are global reference data — admins only
	if (!hasGlobalPermission(locals.user, 'edit_admin')) {
		redirect(StatusCodes.SEE_OTHER, `/catalog/explore/${slug}`);
	}

	const spirit = await catalogRepo.getSpiritById(recipeCategoryId);
	if (!spirit) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'Category not found.',
		});
	}

	return { spirit, spiritContent };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!hasGlobalPermission(locals.user, 'edit_admin')) {
			return fail(StatusCodes.FORBIDDEN, { error: 'You need admin access to edit categories.' });
		}

		const slug = params.spirit as SpiritSlug;
		const recipeCategoryId = slugToId[slug];

		const formData = await request.formData();
		const descriptionText = (
			(formData.get('recipeCategoryDescriptionText') as string) ?? ''
		).trim();
		const imageUrl = (formData.get('recipeCategoryDescriptionImageUrl') as string) || '';
		const imageCleared = formData.get('recipeCategoryDescriptionImageCleared') === 'true';

		const result = await catalogRepo.updateSpirit(
			recipeCategoryId,
			descriptionText || null,
			imageUrl,
			imageCleared
		);

		if (result.status === 'error') {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: result.error });
		}

		redirect(StatusCodes.SEE_OTHER, `/catalog/explore/${slug}`);
	},
};
