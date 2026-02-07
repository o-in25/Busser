import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/ai', () => ({
	generateImage: vi.fn(),
	generateText: vi.fn(),
}));

import { generateImage, generateText } from '$lib/server/ai';
import { generate } from '$lib/server/generators/generator-factory';

describe('generator factory', () => {
	beforeEach(() => {
		vi.mocked(generateImage).mockReset();
		vi.mocked(generateText).mockReset();
	});

	// ---- image generators ----

	describe('inventory-image', () => {
		it('builds prompt with subject and description', async () => {
			vi.mocked(generateImage).mockResolvedValue({
				url: 'data:image/png;base64,abc',
				mimeType: 'image/png',
				bytesBase64Encoded: 'abc',
			});

			const result = await generate('inventory-image', {
				subject: 'Angostura Bitters',
				description: 'aromatic bitters',
			});

			const prompt = vi.mocked(generateImage).mock.calls[0][0];
			expect(prompt).toContain('Angostura Bitters');
			expect(prompt).toContain('aromatic bitters');
			expect(result.url).toBe('data:image/png;base64,abc');
			expect(result.mimeType).toBe('image/png');
			expect(result.base64).toBe('abc');
		});

		it('works without description', async () => {
			vi.mocked(generateImage).mockResolvedValue({
				url: 'data:image/png;base64,xyz',
				mimeType: 'image/png',
				bytesBase64Encoded: 'xyz',
			});

			await generate('inventory-image', { subject: 'Vodka' });

			const prompt = vi.mocked(generateImage).mock.calls[0][0];
			expect(prompt).toContain('Vodka');
			expect(prompt).not.toContain('Product details');
		});

		it('uses custom prompt template when customPrompt is provided', async () => {
			vi.mocked(generateImage).mockResolvedValue({
				url: 'data:image/png;base64,cust',
				mimeType: 'image/png',
				bytesBase64Encoded: 'cust',
			});

			await generate('inventory-image', {
				subject: 'Gin',
				customPrompt: 'A bottle of gin with juniper berries',
			});

			const prompt = vi.mocked(generateImage).mock.calls[0][0];
			expect(prompt).toContain('A bottle of gin with juniper berries');
			// should not contain the standard inventory prompt subject replacement
			expect(prompt).not.toContain('[SUBJECT]');
		});

		it('calls generateImage with correct options', async () => {
			vi.mocked(generateImage).mockResolvedValue({
				url: 'data:image/png;base64,abc',
				mimeType: 'image/png',
				bytesBase64Encoded: 'abc',
			});

			await generate('inventory-image', { subject: 'Rum' });

			const options = vi.mocked(generateImage).mock.calls[0][1];
			expect(options?.aspectRatio).toBe('1:1');
			expect(options?.negativePrompt).toBeDefined();
			expect(typeof options?.negativePrompt).toBe('string');
		});
	});

	describe('catalog-image', () => {
		it('builds prompt with subject, ingredients, and technique', async () => {
			vi.mocked(generateImage).mockResolvedValue({
				url: 'data:image/png;base64,cat',
				mimeType: 'image/png',
				bytesBase64Encoded: 'cat',
			});

			await generate('catalog-image', {
				subject: 'Margarita',
				ingredients: ['tequila', 'lime juice', 'cointreau'],
				technique: 'Shaken',
			});

			const prompt = vi.mocked(generateImage).mock.calls[0][0];
			expect(prompt).toContain('Margarita');
			expect(prompt).toContain('tequila');
			expect(prompt).toContain('lime juice');
			expect(prompt).toContain('shaken');
		});

		it('works with minimal input (subject only)', async () => {
			vi.mocked(generateImage).mockResolvedValue({
				url: 'data:image/png;base64,min',
				mimeType: 'image/png',
				bytesBase64Encoded: 'min',
			});

			await generate('catalog-image', { subject: 'Old Fashioned' });

			const prompt = vi.mocked(generateImage).mock.calls[0][0];
			expect(prompt).toContain('Old Fashioned');
		});
	});

	// ---- text generators ----

	describe('inventory-description', () => {
		it('builds prompt with name and calls generateText', async () => {
			const mockOutput = { description: 'A versatile spirit.' };
			vi.mocked(generateText).mockResolvedValue(mockOutput);

			const result = await generate('inventory-description', { name: 'Vodka' });

			expect(generateText).toHaveBeenCalledOnce();
			const prompt = vi.mocked(generateText).mock.calls[0][0];
			expect(prompt).toContain('Vodka');
			expect(result).toEqual(mockOutput);
		});
	});

	describe('catalog-description', () => {
		it('builds prompt with name and calls generateText', async () => {
			const mockOutput = {
				history: 'Classic cocktail.',
				flavorProfile: ['sweet'],
				goodWith: ['lime'],
				avoidWith: ['milk'],
			};
			vi.mocked(generateText).mockResolvedValue(mockOutput);

			const result = await generate('catalog-description', { name: 'Daiquiri' });

			const prompt = vi.mocked(generateText).mock.calls[0][0];
			expect(prompt).toContain('Daiquiri');
			expect(result).toEqual(mockOutput);
		});
	});

	describe('recipe-ratings', () => {
		it('builds prompt with recipe info and ingredients', async () => {
			const mockOutput = {
				sweetnessRating: 3,
				drynessRating: 7,
				versatilityRating: 8,
				strengthRating: 6,
			};
			vi.mocked(generateText).mockResolvedValue(mockOutput);

			const result = await generate('recipe-ratings', {
				recipeName: 'Manhattan',
				recipeDescription: 'A classic whiskey cocktail',
				ingredients: [
					{ name: 'Rye Whiskey', quantity: 2, unit: 'oz', proof: 100 },
					{ name: 'Sweet Vermouth', quantity: 1, unit: 'oz' },
					{ name: 'Angostura Bitters', quantity: 2, unit: 'dashes' },
				],
			});

			const prompt = vi.mocked(generateText).mock.calls[0][0];
			expect(prompt).toContain('Manhattan');
			expect(prompt).toContain('Rye Whiskey');
			expect(prompt).toContain('100 proof');
			expect(prompt).toContain('3');
			expect(result).toEqual(mockOutput);
		});
	});

	describe('return shape for image generators', () => {
		it('returns ImageResult shape with url, mimeType, base64', async () => {
			vi.mocked(generateImage).mockResolvedValue({
				url: 'data:image/png;base64,test123',
				mimeType: 'image/png',
				bytesBase64Encoded: 'test123',
			});

			const result = await generate('inventory-image', { subject: 'Test' });

			expect(result).toHaveProperty('url');
			expect(result).toHaveProperty('mimeType');
			expect(result).toHaveProperty('base64');
			expect(result).not.toHaveProperty('bytesBase64Encoded');
		});
	});
});
