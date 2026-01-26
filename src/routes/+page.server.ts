import { catalogRepo, inventoryRepo } from '$lib/server/core';
import { createInvitationRequest, hasWorkspaceAccess } from '$lib/server/auth';
import { checkRateLimit, getClientIp } from '$lib/server/rate-limit';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import type { View } from '$lib/types';

// Global workspace for unauthenticated landing page showcase
const GLOBAL_WORKSPACE_ID = 'ws-global-catalog';

// Rate limit config: 3 requests per hour per IP
const INVITE_REQUEST_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000 // 1 hour
};

export const load = (async ({ locals }) => {
  const user = locals.user;
  // Use user's active workspace for authenticated users, global for landing page
  const workspaceId = user && locals.activeWorkspaceId ? locals.activeWorkspaceId : GLOBAL_WORKSPACE_ID;

  // Get spirits for filter chips
  const baseSpiritsQuery = await catalogRepo.getCategories(workspaceId);

  // Get available recipes (ready to make)
  const gallerySeedQuery = await catalogRepo.getAvailableRecipes(workspaceId);

  if (!('data' in baseSpiritsQuery) || !('data' in gallerySeedQuery)) {
    return error(StatusCodes.INTERNAL_SERVER_ERROR, {
      reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Could not load Gallery. Please try again later.'
    });
  }

  const spirits = baseSpiritsQuery.data || [];
  const recipes = gallerySeedQuery.data || [];

  // Data for authenticated users only
  let dashboardData: {
    inventoryCount: number;
    totalRecipes: number;
    availableCount: number;
    almostThereRecipes: Array<View.BasicRecipe & { missingIngredient: string | null }>;
    allSpirits: Awaited<ReturnType<typeof catalogRepo.getSpirits>>;
    spiritCounts: Record<number, number>;
    topSpirit: Awaited<ReturnType<typeof catalogRepo.getSpirits>>[0] | null;
    userName: string;
    workspaceRole: string | null;
  } | null = null;

  if (user && locals.activeWorkspaceId) {
    // Get user's role in this workspace
    const workspaceRole = await hasWorkspaceAccess(user.userId, workspaceId);

    // Get inventory count
    const inventoryResult = await inventoryRepo.findAll(workspaceId, 1, 1);
    const inventoryCount = inventoryResult.pagination.total;

    // Get total catalog count
    const catalogResult = await catalogRepo.findAll(workspaceId, 1, 1);
    const totalRecipes = catalogResult.pagination.total;

    // Get "almost there" recipes
    const almostThereRecipes = await catalogRepo.getAlmostThereRecipes(workspaceId);

    // Get all spirits with images for the dashboard
    const allSpirits = await catalogRepo.getSpirits();

    // Calculate recipes per spirit for the available recipes
    const spiritCounts: Record<number, number> = {};
    for (const recipe of recipes) {
      if (recipe.recipeCategoryId !== undefined) {
        spiritCounts[recipe.recipeCategoryId] = (spiritCounts[recipe.recipeCategoryId] || 0) + 1;
      }
    }

    // Find most productive spirit (one with most available recipes)
    let topSpirit = allSpirits[0] || null;
    let maxCount = 0;
    for (const spirit of allSpirits) {
      const count = spiritCounts[spirit.recipeCategoryId] || 0;
      if (count > maxCount) {
        maxCount = count;
        topSpirit = spirit;
      }
    }

    // Get user display name
    const userName = user.username || user.email?.split('@')[0] || 'there';

    dashboardData = {
      inventoryCount,
      totalRecipes,
      availableCount: recipes.length,
      almostThereRecipes,
      allSpirits,
      spiritCounts,
      topSpirit,
      userName,
      workspaceRole,
    };
  }

  // Data for unauthenticated landing page
  let landingData: {
    totalRecipes: number;
    spiritCount: number;
    featuredRecipes: View.BasicRecipe[];
  } | null = null;

  if (!user) {
    // Get total catalog count for stats (use global workspace for landing page)
    const catalogResult = await catalogRepo.findAll(GLOBAL_WORKSPACE_ID, 1, 1);
    const totalRecipes = catalogResult.pagination.total;

    // Get spirits for stats
    const allSpirits = await catalogRepo.getSpirits();

    // Get featured recipes (ones with images)
    const featuredResult = await catalogRepo.findAll(GLOBAL_WORKSPACE_ID, 1, 6);
    const featuredRecipes = featuredResult.data.filter(r => r.recipeImageUrl).slice(0, 4);

    landingData = {
      totalRecipes,
      spiritCount: allSpirits.length,
      featuredRecipes,
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
          message: ''
        }
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
          message: message || ''
        }
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return fail(400, {
        requestInvite: {
          error: 'Please enter a valid email address.',
          email,
          message: message || ''
        }
      });
    }

    const result = await createInvitationRequest(email, message);

    if (result.status === 'error') {
      return fail(400, {
        requestInvite: {
          error: result.error,
          email,
          message: message || ''
        }
      });
    }

    return {
      requestInvite: {
        success: true,
        message: 'Your request has been submitted! We\'ll review it and get back to you soon.'
      }
    };
  }
};
