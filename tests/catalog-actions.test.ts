import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusCodes } from 'http-status-codes';

// mock external dependencies before importing the modules under test
vi.mock('$lib/server/auth', () => ({
	canModifyWorkspace: vi.fn(),
}));

vi.mock('$lib/server/core', () => ({
	catalogRepo: {
		save: vi.fn(),
		findById: vi.fn(),
		getSpirits: vi.fn().mockResolvedValue([]),
		getPreparationMethods: vi.fn().mockResolvedValue({ status: 'success', data: [] }),
	},
	inventoryRepo: {
		getProductOptions: vi.fn().mockResolvedValue([]),
	},
}));

import { canModifyWorkspace } from '$lib/server/auth';
import { catalogRepo } from '$lib/server/core';

// helper to build a mock formdata from a plain object
function makeFormData(fields: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.append(k, v);
	return fd;
}

// helper to build a minimal request with formdata
function makeRequest(fields: Record<string, string>): Request {
	const fd = makeFormData(fields);
	return new Request('http://localhost', { method: 'POST', body: fd });
}

// valid form fields for a recipe
const validRecipeFields = {
	recipeName: 'Old Fashioned',
	recipeCategoryId: '1',
	recipeDescription: 'A classic cocktail',
	recipeTechniqueDescriptionId: '2',
	recipeSweetnessRating: '3',
	recipeDrynessRating: '7',
	recipeStrengthRating: '8',
	recipeVersatilityRating: '6',
	recipeSteps: JSON.stringify([{ step: 1, text: 'Muddle sugar with bitters' }]),
};

// ---- catalog add action ----

describe('catalog add action', async () => {
	const { actions } = await import('../src/routes/(workspace)/catalog/add/+page.server');
	const action = actions.default;

	beforeEach(() => {
		vi.mocked(canModifyWorkspace).mockReset();
		vi.mocked(catalogRepo.save).mockReset();
	});

	it('returns 401 when no workspace context', async () => {
		const result = await action({
			request: makeRequest(validRecipeFields),
			locals: { activeWorkspaceId: null, user: null },
		} as any);

		expect(result?.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	it('returns 401 when no user', async () => {
		const result = await action({
			request: makeRequest(validRecipeFields),
			locals: { activeWorkspaceId: 'ws-1', user: null },
		} as any);

		expect(result?.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	it('returns 403 when user lacks permission', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(false);

		const result = await action({
			request: makeRequest(validRecipeFields),
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.FORBIDDEN);
	});

	it('returns 400 when recipeName is empty', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);

		const result = await action({
			request: makeRequest({ ...validRecipeFields, recipeName: '' }),
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.BAD_REQUEST);
		expect(result?.data?.error).toContain('Recipe name');
	});

	it('returns 400 when recipeSteps is malformed json', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);

		const result = await action({
			request: makeRequest({ ...validRecipeFields, recipeSteps: '{bad json' }),
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.BAD_REQUEST);
		expect(result?.data?.error).toContain('Invalid recipe steps');
	});

	it('defaults rating values to 5 and description to empty when not provided', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(catalogRepo.save).mockResolvedValue({
			status: 'success',
			data: { recipe: { recipeId: 42 } },
		} as any);

		const minFields = {
			recipeName: 'Daiquiri',
			recipeCategoryId: '1',
			recipeSteps: '[]',
		};

		try {
			await action({
				request: makeRequest(minFields),
				locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
			} as any);
		} catch {
			// redirect is expected on success
		}

		const [, recipe] = vi.mocked(catalogRepo.save).mock.calls[0];
		expect(recipe.recipeDescription).toBe('');
		expect(recipe.recipeSweetnessRating).toBe(5);
		expect(recipe.recipeDrynessRating).toBe(5);
		expect(recipe.recipeStrengthRating).toBe(5);
		expect(recipe.recipeVersatilityRating).toBe(5);
	});

	it('calls catalogRepo.save with correct args on valid input', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(catalogRepo.save).mockResolvedValue({
			status: 'success',
			data: { recipe: { recipeId: 10 } },
		} as any);

		try {
			await action({
				request: makeRequest(validRecipeFields),
				locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
			} as any);
		} catch {
			// redirect
		}

		expect(catalogRepo.save).toHaveBeenCalledOnce();
		const [workspaceId, recipe, steps, imageUrl, imageCleared] = vi.mocked(catalogRepo.save).mock
			.calls[0];
		expect(workspaceId).toBe('ws-1');
		expect(recipe.recipeName).toBe('Old Fashioned');
		expect(recipe.recipeCategoryId).toBe(1);
		expect(steps).toEqual([{ step: 1, text: 'Muddle sugar with bitters' }]);
		expect(imageUrl).toBe('');
		expect(imageCleared).toBe(false);
	});

	it('returns 500 when catalogRepo.save returns error', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(catalogRepo.save).mockResolvedValue({
			status: 'error',
			error: 'DB connection failed',
		} as any);

		const result = await action({
			request: makeRequest(validRecipeFields),
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(result?.data?.error).toBe('DB connection failed');
	});
});

// ---- catalog edit action ----

describe('catalog edit action', async () => {
	const { actions } =
		await import('../src/routes/(workspace)/catalog/[recipeId]/edit/+page.server');
	const action = actions.default;

	beforeEach(() => {
		vi.mocked(canModifyWorkspace).mockReset();
		vi.mocked(catalogRepo.save).mockReset();
	});

	it('returns 401 when no workspace context', async () => {
		const result = await action({
			request: makeRequest(validRecipeFields),
			params: { recipeId: '5' },
			locals: { activeWorkspaceId: null, user: null },
		} as any);

		expect(result?.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	it('returns 403 when user lacks permission', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(false);

		const result = await action({
			request: makeRequest(validRecipeFields),
			params: { recipeId: '5' },
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.FORBIDDEN);
	});

	it('returns 400 when recipeName is empty', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);

		const result = await action({
			request: makeRequest({ ...validRecipeFields, recipeName: '' }),
			params: { recipeId: '5' },
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.BAD_REQUEST);
	});

	it('includes recipeId from params in the save call', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(catalogRepo.save).mockResolvedValue({
			status: 'success',
			data: { recipe: { recipeId: 5 } },
		} as any);

		try {
			await action({
				request: makeRequest(validRecipeFields),
				params: { recipeId: '5' },
				locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
			} as any);
		} catch {
			// redirect
		}

		const [, recipe] = vi.mocked(catalogRepo.save).mock.calls[0];
		expect(recipe.recipeId).toBe(5);
	});

	it('returns 500 when catalogRepo.save returns error', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(catalogRepo.save).mockResolvedValue({
			status: 'error',
			error: 'Update failed',
		} as any);

		const result = await action({
			request: makeRequest(validRecipeFields),
			params: { recipeId: '5' },
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(result?.data?.error).toBe('Update failed');
	});
});
