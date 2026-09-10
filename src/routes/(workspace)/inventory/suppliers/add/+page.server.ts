import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/workspace';
import { inventoryRepo } from '$lib/server/core';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;

	// viewers cannot access the add page
	if (!locals.user) {
		redirect(StatusCodes.SEE_OTHER, '/login');
	}
	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		redirect(StatusCodes.SEE_OTHER, '/inventory/suppliers');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const workspaceId = locals.activeWorkspaceId;
		if (!workspaceId || !locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Workspace context required.' });
		}

		const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
		if (!canModify) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'You need editor or owner access to add suppliers.',
			});
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		if (!name?.trim()) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Supplier name is required.' });
		}

		const type = (formData.get('type') as string) || 'liquor_store';
		const supplierTypeId = await inventoryRepo.getSupplierTypeIdByName(type);

		const result = await inventoryRepo.createSupplier(workspaceId, {
			supplierName: name.trim(),
			supplierDetails: (formData.get('details') as string) || null,
			supplierWebsiteUrl: (formData.get('website') as string) || null,
			supplierPhone: (formData.get('phone') as string) || null,
			supplierAddress: (formData.get('address') as string) || null,
			supplierPlaceId: (formData.get('placeId') as string) || null,
			supplierTypeId,
		});

		if (result.status === 'error') {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: result.error });
		}

		redirect(StatusCodes.SEE_OTHER, '/inventory/suppliers');
	},
};
