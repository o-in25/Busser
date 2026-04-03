import { error, fail } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { createInvitationRequest, isInviteOnly } from '$lib/server/auth';
import { hasWorkspaceAccess } from '$lib/server/workspace';
import { catalogRepo, inventoryRepo } from '$lib/server/core';
import { checkRateLimit, getClientIp } from '$lib/server/rate-limit';
import { getGlobalWorkspace } from '$lib/server/workspace';
import { indexFromSeed } from '$lib/math';
import type { View } from '$lib/types';

import type { Actions, PageServerLoad } from './$types';

// Rate limit config: 3 requests per hour per IP
const INVITE_REQUEST_RATE_LIMIT = {
	maxRequests: 3,
	windowMs: 60 * 60 * 1000, // 1 hour
};

export const load = (async ({ locals }) => {
	const { user } = locals;
	const globalWorkspace = getGlobalWorkspace();
	// Use user's active workspace for authenticated users, global for landing page
	const workspaceId =
		user && locals.activeWorkspaceId ? locals.activeWorkspaceId : globalWorkspace;

	// Get spirits for filter chips
	const baseSpiritsQuery = await catalogRepo.getCategories();

	// check role early so we can decide which recipes to load
	const workspaceRole = user && locals.activeWorkspaceId
		? await hasWorkspaceAccess(user.userId, workspaceId)
		: null;
	const isOwner = workspaceRole === 'owner';

	// owners see available (ready to make) recipes; non-owners see full catalog
	let recipes: View.BasicRecipe[] = [];
	if (isOwner) {
		const gallerySeedQuery = await catalogRepo.getAvailableRecipes(workspaceId);
		if (!('data' in baseSpiritsQuery) || !('data' in gallerySeedQuery)) {
			return error(StatusCodes.INTERNAL_SERVER_ERROR, {
				reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
				code: StatusCodes.INTERNAL_SERVER_ERROR,
				message: 'Could not load Gallery. Please try again later.',
			});
		}
		recipes = gallerySeedQuery.data || [];
	} else {
		if (!('data' in baseSpiritsQuery)) {
			return error(StatusCodes.INTERNAL_SERVER_ERROR, {
				reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
				code: StatusCodes.INTERNAL_SERVER_ERROR,
				message: 'Could not load Gallery. Please try again later.',
			});
		}
		const allRecipes = await catalogRepo.findAll(workspaceId, 1, 100);
		recipes = allRecipes.data || [];
	}

	const spirits = baseSpiritsQuery.data || [];

	// Data for authenticated users only
	let dashboardData: {
		inventoryCount: number;
		totalRecipes: number;
		availableCount: number;
		almostThereRecipes: Array<View.BasicRecipe & { missingIngredient: string | null }>;
		userName: string;
		workspaceRole: string | null;
		highImpactIngredients: { ingredientName: string; unlockableRecipes: number }[];
		barBreakdown: Awaited<ReturnType<typeof inventoryRepo.getCategoryBreakdown>>;
		catalogCoverage: number;
		tasteProfile: {
			sweetness: number;
			dryness: number;
			strength: number;
			versatility: number;
		} | null;
		costBreakdown: {
			averageCost: number;
			cheapest: { recipeName: string; recipeId: number; recipeImageUrl: string | null; cost: number } | null;
			priciest: { recipeName: string; recipeId: number; recipeImageUrl: string | null; cost: number } | null;
			barValue: number;
			barValueByCategory: { groupName: string; value: number }[];
		} | null;
	} | null = null;

	if (user && locals.activeWorkspaceId) {

		// Get inventory count
		const inventoryResult = await inventoryRepo.findAll(workspaceId, 1, 1);
		const inventoryCount = inventoryResult.pagination.total;

		// Get total catalog count
		const catalogResult = await catalogRepo.findAll(workspaceId, 1, 1);
		const totalRecipes = catalogResult.pagination.total;

		// Get "almost there" recipes
		const almostThereRecipes = await catalogRepo.getAlmostThereRecipes(workspaceId);

		// Get highest impact ingredients
		const highImpactIngredients = await catalogRepo.getHighestImpactIngredients(workspaceId);

		// Get inventory category breakdown
		const barBreakdown = await inventoryRepo.getCategoryBreakdown(workspaceId);

		// Catalog coverage: what % of recipes can you make
		const catalogCoverage = totalRecipes > 0 ? recipes.length / totalRecipes : 0;

		// Get user display name
		const userName = user.username || user.email?.split('@')[0] || 'there';

		// taste profile: average ratings across available recipes
		const tasteProfile = recipes.length > 0 ? {
			sweetness: recipes.reduce((s, r) => s + r.recipeSweetnessRating, 0) / recipes.length,
			dryness: recipes.reduce((s, r) => s + r.recipeDrynessRating, 0) / recipes.length,
			strength: recipes.reduce((s, r) => s + r.recipeStrengthRating, 0) / recipes.length,
			versatility: recipes.reduce((s, r) => s + r.recipeVersatilityRating, 0) / recipes.length,
		} : null;

		// cost breakdown from available recipe steps
		const recipeCosts = await catalogRepo.getRecipeCosts(workspaceId);
		const pricedRecipes = recipeCosts.filter((r) => r.estimatedCost > 0);
		let costBreakdown: {
			averageCost: number;
			cheapest: { recipeName: string; recipeId: number; recipeImageUrl: string | null; cost: number } | null;
			priciest: { recipeName: string; recipeId: number; recipeImageUrl: string | null; cost: number } | null;
			barValue: number;
			barValueByCategory: { groupName: string; value: number }[];
		} | null = null;
		if (pricedRecipes.length > 0) {
			const totalCost = pricedRecipes.reduce((s, r) => s + r.estimatedCost, 0);
			const cheapest = pricedRecipes[0];
			const priciest = pricedRecipes[pricedRecipes.length - 1];

			// total bar value + per-category breakdown
			const barValueResult = await inventoryRepo.findAll(workspaceId, 1, 9999);
			let barValue = 0;
			const categoryMap: Record<string, number> = {};
			for (const p of barValueResult.data) {
				const pv = (p.productPricePerUnit || 0) * (p.productInStockQuantity || 0);
				barValue += pv;
				if (pv > 0) {
					const group = p.categoryGroupName || 'Other';
					categoryMap[group] = (categoryMap[group] || 0) + pv;
				}
			}
			const barValueByCategory = Object.entries(categoryMap)
				.map(([groupName, value]) => ({ groupName, value }))
				.sort((a, b) => b.value - a.value);

			costBreakdown = {
				averageCost: totalCost / pricedRecipes.length,
				cheapest: { recipeName: cheapest.recipeName, recipeId: cheapest.recipeId, recipeImageUrl: cheapest.recipeImageUrl, cost: cheapest.estimatedCost },
				priciest: { recipeName: priciest.recipeName, recipeId: priciest.recipeId, recipeImageUrl: priciest.recipeImageUrl, cost: priciest.estimatedCost },
				barValue,
				barValueByCategory,
			};
		}

		dashboardData = {
			inventoryCount,
			totalRecipes,
			availableCount: recipes.length,
			almostThereRecipes,
			userName,
			workspaceRole,
			highImpactIngredients,
			barBreakdown,
			catalogCoverage,
			tasteProfile,
			costBreakdown,
		};
	}

	// Data for unauthenticated landing page
	let landingData: {
		totalRecipes: number;
		spiritCount: number;
		featuredRecipes: View.BasicRecipe[];
		inviteOnly: boolean;
		allSpirits: Awaited<ReturnType<typeof catalogRepo.getSpirits>>;
		cocktailOfTheDay: View.BasicRecipe | null;
	} | null = null;

	if (!user) {
		// Get total catalog count for stats (use global workspace for landing page)
		const catalogResult = await catalogRepo.findAll(globalWorkspace, 1, 1);
		const totalRecipes = catalogResult.pagination.total;

		// Get spirits for browse-by-spirit shortcuts
		const allSpirits = await catalogRepo.getSpirits();

		// get all admin-curated featured recipes for carousel
		const allFeatured = await catalogRepo.getFeatured(globalWorkspace);

		const inviteOnly = await isInviteOnly();

		// deterministic daily pick from full featured list (must match catalog page pool)
		const today = new Date();
		const dateSeed = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
		const cocktailOfTheDay = indexFromSeed(allFeatured, dateSeed);

		landingData = {
			totalRecipes,
			spiritCount: allSpirits.length,
			featuredRecipes: allFeatured,
			inviteOnly,
			allSpirits,
			cocktailOfTheDay,
		};
	}

	return {
		spirits,
		recipes,
		dashboardData,
		landingData,
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	requestInvite: async ({ request }) => {
		// Rate limit check
		const clientIp = getClientIp(request);
		const rateLimitKey = `invite-request:${clientIp}`;
		const rateLimit = checkRateLimit(rateLimitKey, INVITE_REQUEST_RATE_LIMIT);

		if (!rateLimit.allowed) {
			const minutesRemaining = Math.ceil((rateLimit.retryAfterMs || 0) / 60000);
			return fail(429, {
				requestInvite: {
					error: `Too many requests. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
					email: '',
					message: '',
				},
			});
		}

		const formData = await request.formData();
		const email = formData.get('email') as string | null;
		const message = formData.get('message') as string | null;

		if (!email || !email.trim()) {
			return fail(400, {
				requestInvite: {
					error: 'Please enter your email address.',
					email: '',
					message: message || '',
				},
			});
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			return fail(400, {
				requestInvite: {
					error: 'Please enter a valid email address.',
					email,
					message: message || '',
				},
			});
		}

		const result = await createInvitationRequest(email, message);

		if (result.status === 'error') {
			return fail(400, {
				requestInvite: {
					error: result.error,
					email,
					message: message || '',
				},
			});
		}

		return {
			requestInvite: {
				success: true,
				message: "Your request has been submitted! We'll review it and get back to you soon.",
			},
		};
	},
};
