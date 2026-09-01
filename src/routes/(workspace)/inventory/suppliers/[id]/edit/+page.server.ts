import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/workspace';
import { inventoryRepo } from '$lib/server/core';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const { id } = params;

	// viewers cannot access the edit page
	if (!locals.user) {
		redirect(StatusCodes.SEE_OTHER, '/login');
	}
	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		redirect(StatusCodes.SEE_OTHER, '/inventory/suppliers');
	}

	// only workspace-owned suppliers are editable; global ones are view-only
	const supplier = id && !isNaN(Number(id)) ? await inventoryRepo.getSupplierById(workspaceId, Number(id)) : null;
	if (!supplier) {
		redirect(StatusCodes.SEE_OTHER, '/inventory/suppliers');
	}

	return { supplier };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const workspaceId = locals.activeWorkspaceId;
		if (!workspaceId || !locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Workspace context required.' });
		}

		const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
		if (!canModify) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'You need editor or owner access to edit suppliers.',
			});
		}

		const { id } = params;
		const formData = await request.formData();
		const name = formData.get('name') as string;
		if (!name?.trim()) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Supplier name is required.' });
		}

		const type = (formData.get('type') as string) || 'liquor_store';
		const supplierTypeId = await inventoryRepo.getSupplierTypeIdByName(type);

		const result = await inventoryRepo.updateSupplier(workspaceId, Number(id), {
			supplierName: name.trim(),
			supplierDetails: (formData.get('details') as string) || null,
			supplierWebsiteUrl: (formData.get('website') as string) || null,
			supplierPhone: (formData.get('phone') as string) || null,
			supplierAddress: (formData.get('address') as string) || null,
			supplierTypeId,
		});

		if (result.status === 'error') {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: result.error });
		}

		redirect(StatusCodes.SEE_OTHER, '/inventory/suppliers');
	},
};
