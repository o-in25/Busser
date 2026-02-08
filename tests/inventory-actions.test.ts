import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusCodes } from 'http-status-codes';

vi.mock('$lib/server/auth', () => ({
	canModifyWorkspace: vi.fn(),
}));

vi.mock('$lib/server/core', () => ({
	inventoryRepo: {
		create: vi.fn(),
		update: vi.fn(),
		findById: vi.fn(),
		getCategoryOptions: vi.fn().mockResolvedValue([]),
	},
}));

import { canModifyWorkspace } from '$lib/server/auth';
import { inventoryRepo } from '$lib/server/core';

function makeRequest(fields: Record<string, string>): Request {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.append(k, v);
	return new Request('http://localhost', { method: 'POST', body: fd });
}

const validProductFields = {
	productName: 'Bulleit Bourbon',
	categoryId: '3',
	productPricePerUnit: '29.99',
	productUnitSizeInMilliliters: '750',
	productProof: '90',
	productInStockQuantity: '2',
	productSweetnessRating: '4',
	productDrynessRating: '6',
	productStrengthRating: '8',
	productVersatilityRating: '7',
	productDescription: 'A smooth bourbon',
	productImageUrl: '',
};

// ---- inventory add action ----

describe('inventory add action', async () => {
	const { actions } = await import('../src/routes/(workspace)/inventory/add/+page.server');
	const action = actions.add;

	beforeEach(() => {
		vi.mocked(canModifyWorkspace).mockReset();
		vi.mocked(inventoryRepo.create).mockReset();
	});

	it('returns 401 when no workspace context', async () => {
		const result = await action({
			request: makeRequest(validProductFields),
			locals: { activeWorkspaceId: null, user: null },
		} as any);

		expect(result?.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	it('returns 401 when no user', async () => {
		const result = await action({
			request: makeRequest(validProductFields),
			locals: { activeWorkspaceId: 'ws-1', user: null },
		} as any);

		expect(result?.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	it('returns 403 when user lacks permission', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(false);

		const result = await action({
			request: makeRequest(validProductFields),
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.FORBIDDEN);
	});

	it('returns 400 when productName is missing', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);

		const result = await action({
			request: makeRequest({ ...validProductFields, productName: '' }),
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.BAD_REQUEST);
		expect(result?.data?.error).toContain('Product name');
	});

	it('returns 400 when categoryId is missing', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);

		const result = await action({
			request: makeRequest({ ...validProductFields, categoryId: '' }),
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.BAD_REQUEST);
		expect(result?.data?.error).toContain('Category');
	});

	it('defaults numeric fields to 0 when not provided', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(inventoryRepo.create).mockResolvedValue({ status: 'success' } as any);

		const minFields = {
			productName: 'Simple Syrup',
			categoryId: '5',
		};

		try {
			await action({
				request: makeRequest(minFields),
				locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
			} as any);
		} catch {
			// redirect
		}

		const [, product] = vi.mocked(inventoryRepo.create).mock.calls[0];
		expect(product.productPricePerUnit).toBe(0);
		expect(product.productProof).toBe(0);
		expect(product.productUnitSizeInMilliliters).toBe(0);
		expect(product.productInStockQuantity).toBe(0);
		expect(product.productSweetnessRating).toBe(0);
		expect(product.productDrynessRating).toBe(0);
		expect(product.productStrengthRating).toBe(0);
		expect(product.productVersatilityRating).toBe(0);
	});

	it('calls inventoryRepo.create with correct args on valid input', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(inventoryRepo.create).mockResolvedValue({ status: 'success' } as any);

		try {
			await action({
				request: makeRequest(validProductFields),
				locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
			} as any);
		} catch {
			// redirect
		}

		expect(inventoryRepo.create).toHaveBeenCalledOnce();
		const [workspaceId, product, imageUrl] = vi.mocked(inventoryRepo.create).mock.calls[0];
		expect(workspaceId).toBe('ws-1');
		expect(product.productName).toBe('Bulleit Bourbon');
		expect(product.categoryId).toBe(3);
		expect(product.productProof).toBe(90);
		expect(imageUrl).toBe('');
	});

	it('returns 500 when inventoryRepo.create returns error', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(inventoryRepo.create).mockResolvedValue({
			status: 'error',
			error: 'Insert failed',
		} as any);

		const result = await action({
			request: makeRequest(validProductFields),
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(result?.data?.error).toBe('Insert failed');
	});
});

// ---- inventory edit action ----

describe('inventory edit action', async () => {
	const { actions } = await import('../src/routes/(workspace)/inventory/[id]/edit/+page.server');
	const action = actions.edit;

	beforeEach(() => {
		vi.mocked(canModifyWorkspace).mockReset();
		vi.mocked(inventoryRepo.update).mockReset();
	});

	it('returns 401 when no workspace context', async () => {
		const result = await action({
			request: makeRequest(validProductFields),
			params: { id: '7' },
			locals: { activeWorkspaceId: null, user: null },
		} as any);

		expect(result?.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	it('returns 403 when user lacks permission', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(false);

		const result = await action({
			request: makeRequest(validProductFields),
			params: { id: '7' },
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.FORBIDDEN);
	});

	it('returns 400 when productName is empty', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);

		const result = await action({
			request: makeRequest({ ...validProductFields, productName: '' }),
			params: { id: '7' },
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.BAD_REQUEST);
	});

	it('returns 400 when categoryId is empty', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);

		const result = await action({
			request: makeRequest({ ...validProductFields, categoryId: '' }),
			params: { id: '7' },
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.BAD_REQUEST);
	});

	it('includes productId from params and calls inventoryRepo.update', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(inventoryRepo.update).mockResolvedValue({ status: 'success' } as any);

		try {
			await action({
				request: makeRequest(validProductFields),
				params: { id: '7' },
				locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
			} as any);
		} catch {
			// redirect
		}

		expect(inventoryRepo.update).toHaveBeenCalledOnce();
		const [workspaceId, product] = vi.mocked(inventoryRepo.update).mock.calls[0];
		expect(workspaceId).toBe('ws-1');
		expect(product.productId).toBe(7);
		expect(product.productName).toBe('Bulleit Bourbon');
	});

	it('handles productImageCleared flag correctly', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(inventoryRepo.update).mockResolvedValue({ status: 'success' } as any);

		try {
			await action({
				request: makeRequest({ ...validProductFields, productImageCleared: 'true' }),
				params: { id: '7' },
				locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
			} as any);
		} catch {
			// redirect
		}

		const [, , , imageCleared] = vi.mocked(inventoryRepo.update).mock.calls[0];
		expect(imageCleared).toBe(true);
	});

	it('returns 500 when inventoryRepo.update returns error', async () => {
		vi.mocked(canModifyWorkspace).mockResolvedValue(true);
		vi.mocked(inventoryRepo.update).mockResolvedValue({
			status: 'error',
			error: 'Update failed',
		} as any);

		const result = await action({
			request: makeRequest(validProductFields),
			params: { id: '7' },
			locals: { activeWorkspaceId: 'ws-1', user: { userId: 'u1' } },
		} as any);

		expect(result?.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(result?.data?.error).toBe('Update failed');
	});
});
