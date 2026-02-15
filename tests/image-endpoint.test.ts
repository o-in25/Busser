import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusCodes } from 'http-status-codes';

vi.mock('$lib/server/generators/generator-factory', () => ({
	generate: vi.fn(),
}));

import { generate } from '$lib/server/generators/generator-factory';

// sveltekit error() throws an HttpError - we capture it
function isHttpError(err: unknown): err is { status: number; body: { message: string } } {
	return typeof err === 'object' && err !== null && 'status' in err && 'body' in err;
}

// helper to build a json request
function makeJsonRequest(body: Record<string, unknown>): Request {
	return new Request('http://localhost/api/generator/image', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

describe('image generation endpoint', async () => {
	const { POST } = await import('../src/routes/api/generator/image/+server');

	beforeEach(() => {
		vi.mocked(generate).mockReset();
	});

	it('throws 401 when no workspace context', async () => {
		try {
			await POST({
				request: makeJsonRequest({ subject: 'test' }),
				locals: { activeWorkspaceId: null },
			} as any);
			expect.fail('should have thrown');
		} catch (err) {
			if (isHttpError(err)) {
				expect(err.status).toBe(StatusCodes.UNAUTHORIZED);
			} else {
				throw err;
			}
		}
	});

	// note: the validation error() is inside the try/catch in the endpoint,
	// so it gets caught and re-thrown as 500. this tests current behavior.
	it('throws when neither subject nor customPrompt is provided', async () => {
		try {
			await POST({
				request: makeJsonRequest({ type: 'product' }),
				locals: { activeWorkspaceId: 'ws-1' },
			} as any);
			expect.fail('should have thrown');
		} catch (err) {
			if (isHttpError(err)) {
				expect(err.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
			} else {
				throw err;
			}
		}
	});

	it('routes to inventory-image generator when type is product', async () => {
		const mockResult = { url: 'data:image/png;base64,abc', mimeType: 'image/png', base64: 'abc' };
		vi.mocked(generate).mockResolvedValue(mockResult);

		const response = await POST({
			request: makeJsonRequest({
				subject: 'Bourbon',
				type: 'product',
				description: 'smooth whiskey',
			}),
			locals: { activeWorkspaceId: 'ws-1' },
		} as any);

		expect(generate).toHaveBeenCalledWith('inventory-image', {
			subject: 'Bourbon',
			description: 'smooth whiskey',
			customPrompt: undefined,
		});

		const json = await response.json();
		expect(json.url).toBe('data:image/png;base64,abc');
	});

	it('routes to catalog-image generator when type is cocktail', async () => {
		const mockResult = { url: 'data:image/png;base64,xyz', mimeType: 'image/png', base64: 'xyz' };
		vi.mocked(generate).mockResolvedValue(mockResult);

		const response = await POST({
			request: makeJsonRequest({
				subject: 'Margarita',
				type: 'cocktail',
				ingredients: ['tequila', 'lime', 'cointreau'],
				technique: 'shaken',
			}),
			locals: { activeWorkspaceId: 'ws-1' },
		} as any);

		expect(generate).toHaveBeenCalledWith('catalog-image', {
			subject: 'Margarita',
			ingredients: ['tequila', 'lime', 'cointreau'],
			technique: 'shaken',
			customPrompt: undefined,
		});

		const json = await response.json();
		expect(json.url).toBe('data:image/png;base64,xyz');
	});

	it('passes customPrompt when provided', async () => {
		const mockResult = { url: 'data:image/png;base64,def', mimeType: 'image/png', base64: 'def' };
		vi.mocked(generate).mockResolvedValue(mockResult);

		await POST({
			request: makeJsonRequest({
				subject: 'Negroni',
				type: 'cocktail',
				customPrompt: 'A red cocktail in a rocks glass',
			}),
			locals: { activeWorkspaceId: 'ws-1' },
		} as any);

		const [, input] = vi.mocked(generate).mock.calls[0] as [string, { customPrompt?: string }];
		expect(input.customPrompt).toBe('A red cocktail in a rocks glass');
	});

	it('throws 500 with friendly message when generator throws an error', async () => {
		vi.mocked(generate).mockRejectedValue(new Error('Vertex API limit exceeded'));

		try {
			await POST({
				request: makeJsonRequest({ subject: 'Mojito', type: 'cocktail' }),
				locals: { activeWorkspaceId: 'ws-1' },
			} as any);
			expect.fail('should have thrown');
		} catch (err) {
			if (isHttpError(err)) {
				expect(err.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
				expect(err.body.message).not.toContain('Vertex');
				expect(err.body.message).toContain('Something went wrong');
			} else {
				throw err;
			}
		}
	});

	it('returns quota-specific message for RESOURCE_EXHAUSTED errors', async () => {
		vi.mocked(generate).mockRejectedValue(new Error('8 RESOURCE_EXHAUSTED: Quota exceeded'));

		try {
			await POST({
				request: makeJsonRequest({ subject: 'Mojito', type: 'cocktail' }),
				locals: { activeWorkspaceId: 'ws-1' },
			} as any);
			expect.fail('should have thrown');
		} catch (err) {
			if (isHttpError(err)) {
				expect(err.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
				expect(err.body.message).toContain('temporarily unavailable');
			} else {
				throw err;
			}
		}
	});
});
