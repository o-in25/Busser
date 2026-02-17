import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { inventoryRepo } from '$lib/server/core';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;

	// Redirect to page 1 if no params
	if (!url.searchParams.size) {
		throw redirect(StatusCodes.TEMPORARY_REDIRECT, url.pathname.concat('?', 'page=1'));
	}

	// Parse URL params
	let page: string | number = url.searchParams.get('page') || '1';
	page = Number(page);
	const search = url.searchParams.get('search') || '';
	const perPage = Math.min(Math.max(Number(url.searchParams.get('perPage')) || 50, 10), 100);

	const [{ data: categories, pagination }, stats] = await Promise.all([
		inventoryRepo.findAllCategories(workspaceId, page, perPage, search || null),
		inventoryRepo.getStats(workspaceId),
	]);

	return {
		categories,
		pagination,
		totalProducts: stats.total,
		filters: {
			search,
			page,
			perPage,
		},
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const workspaceId = locals.activeWorkspaceId;
		if (!workspaceId) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Workspace context required.' });
		}

		const formData = await request.formData();
		const categoryId = formData.get('categoryId');

		if (!categoryId || isNaN(Number(categoryId))) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Invalid category ID.' });
		}

		const result = await inventoryRepo.deleteCategory(workspaceId, Number(categoryId));

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, { error: result.error });
		}

		return { success: true };
	},
};
