import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { catalogRepo, inventoryRepo } from '$lib/server/core';

import type { RecipeProposal } from '$lib/types/assistant';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required',
		});
	}

	const body = await request.json();
	const proposal: RecipeProposal = body.proposal;

	if (!proposal) {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'Proposal is required',
		});
	}

	try {
		// Step 1: Create missing ingredients (categories + products)
		const resolvedMissing: Array<{ productId: number; categoryId: number; productName: string }> =
			[];

		for (const missing of proposal.missingIngredients) {
			let categoryId = missing.categoryId;

			// resolve category: find existing by name, or create if truly new
			if (!categoryId) {
				const existing = await inventoryRepo.findAllCategories(
					workspaceId,
					1,
					10,
					missing.categoryName
				);
				const exactMatch = existing.data.find(
					(c) => c.categoryName.toLowerCase() === missing.categoryName.toLowerCase()
				);

				if (exactMatch) {
					categoryId = exactMatch.categoryId;
				} else {
					const catResult = await inventoryRepo.createCategory(
						workspaceId,
						missing.categoryName,
						null,
						missing.parentCategoryId
					);
					if (catResult.status === 'success' && catResult.data) {
						categoryId = catResult.data;
					} else {
						throw new Error(`Failed to create category: ${missing.categoryName}`);
					}
				}
			}

			// create product
			const productResult = await inventoryRepo.create(workspaceId, {
				productName: missing.productName,
				categoryId,
				supplierId: 1,
				productInStockQuantity: 0,
				productPricePerUnit: 0,
				productUnitSizeInMilliliters: 750,
				productProof: 0,
				productDescription: '',
				productImageUrl: '',
				productSweetnessRating: 0,
				productDrynessRating: 0,
				productVersatilityRating: 0,
				productStrengthRating: 0,
				productId: null,
				productDetailId: null,
				categoryName: missing.categoryName,
				categoryDescription: '',
			} as any);

			if (productResult.status === 'success' && productResult.data) {
				resolvedMissing.push({
					productId: productResult.data.productId!,
					categoryId,
					productName: missing.productName,
				});
			} else {
				throw new Error(`Failed to create product: ${missing.productName}`);
			}
		}

		// Step 2: Build recipe steps
		const recipeSteps = [
			...proposal.ingredients.map((ing) => ({
				productId: ing.productId!,
				categoryId: ing.categoryId,
				matchMode: ing.matchMode,
				productIdQuantityInMilliliters: ing.quantityMl,
				productIdQuantityUnit: ing.unit,
				recipeStepDescription: ing.description,
			})),
			...proposal.missingIngredients.map((missing, index) => ({
				productId: resolvedMissing[index]?.productId || 0,
				categoryId: resolvedMissing[index]?.categoryId || 0,
				matchMode: 'EXACT_PRODUCT' as const,
				productIdQuantityInMilliliters: missing.quantityMl,
				productIdQuantityUnit: missing.unit,
				recipeStepDescription: missing.description,
			})),
		];

		// Step 3: Create the recipe
		const recipe = {
			recipeName: proposal.recipeName,
			recipeDescription: proposal.recipeDescription,
			recipeCategoryId: proposal.recipeCategoryId,
			recipeTechniqueDescriptionId: proposal.preparationMethodId,
			recipeSweetnessRating: proposal.ratings.sweetness,
			recipeDrynessRating: proposal.ratings.dryness,
			recipeStrengthRating: proposal.ratings.strength,
			recipeVersatilityRating: proposal.ratings.versatility,
		};

		const result = await catalogRepo.save(workspaceId, recipe, recipeSteps, null as any);

		if (result.status === 'error') {
			throw new Error(result.error);
		}

		return json({
			status: 'success',
			data: {
				recipe: result.data,
				createdProducts: resolvedMissing,
			},
		});
	} catch (err: any) {
		console.error('Failed to confirm recipe:', err);
		error(StatusCodes.INTERNAL_SERVER_ERROR, {
			reason: 'Internal Server Error',
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message: err.message || 'Failed to create recipe',
		});
	}
};
