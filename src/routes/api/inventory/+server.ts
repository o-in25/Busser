import { error, json } from '@sveltejs/kit';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { inventoryRepo } from '$lib/server/core';
import { canModifyWorkspace } from '$lib/server/workspace';
import type { Product } from '$lib/types';

import type { RequestHandler } from './$types';

// json create endpoint used by the nested product sheet (page actions navigate, this does not)
export const POST: RequestHandler = async ({ request, locals }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId || !locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required.',
		});
	}

	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		error(StatusCodes.FORBIDDEN, {
			reason: getReasonPhrase(StatusCodes.FORBIDDEN),
			code: StatusCodes.FORBIDDEN,
			message: 'You need editor or owner access to add inventory items.',
		});
	}

	const body = await request.json();
	const productName = (body.productName ?? '').trim();
	const categoryId = Number(body.categoryId) || 0;

	if (!productName) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'Product name is required.',
		});
	}
	if (!categoryId) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'Category is required.',
		});
	}

	const product = {
		productName,
		categoryId,
		productPricePerUnit: Number(body.productPricePerUnit) || 0,
		productUnitSizeInMilliliters: Number(body.productUnitSizeInMilliliters) || 0,
		productProof: Number(body.productProof) || 0,
		productInStockQuantity: Number(body.productInStockQuantity) || 0,
		productSweetnessRating: Number(body.productSweetnessRating) || 0,
		productDrynessRating: Number(body.productDrynessRating) || 0,
		productStrengthRating: Number(body.productStrengthRating) || 0,
		productVersatilityRating: Number(body.productVersatilityRating) || 0,
		productDescription: body.productDescription ?? '',
		supplierId: Number(body.supplierId) || 1,
	} as Product;

	const result = await inventoryRepo.create(workspaceId, product, body.productImageUrl ?? '');
	if (result.status === 'error') {
		error(StatusCodes.INTERNAL_SERVER_ERROR, {
			reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message: result.error,
		});
	}

	const productId = result.data?.productId;
	// enrich with category metadata so SearchableSelect can consume the option directly
	const options = await inventoryRepo.getProductOptions(workspaceId);
	const option =
		options.find((o) => String(o.value) === String(productId)) ??
		({
			name: productName,
			value: productId,
			categoryId,
			categoryName: null,
			parentCategoryId: null,
			parentCategoryName: null,
		} as const);

	return json(option);
};
