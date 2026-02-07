import { describe, it, expect } from 'vitest';

import {
	marshal,
	marshalToType,
	pascalCase,
	camelCase,
	titleCase,
} from '$lib/server/repositories/base.repository';

// ---- case helpers ----

describe('case helpers', () => {
	it('pascalCase converts camelCase to PascalCase', () => {
		expect(pascalCase('productName')).toBe('ProductName');
		expect(pascalCase('recipeId')).toBe('RecipeId');
	});

	it('camelCase converts PascalCase to camelCase', () => {
		expect(camelCase('ProductName')).toBe('productName');
		expect(camelCase('RecipeId')).toBe('recipeId');
	});

	it('titleCase converts camelCase to Title Case', () => {
		expect(titleCase('productName')).toBe('Product Name');
		expect(titleCase('recipeStepId')).toBe('Recipe Step Id');
	});
});

// ---- marshal ----

describe('marshal', () => {
	it('converts PascalCase keys to camelCase by default', () => {
		const result = marshal({ ProductName: 'Gin', CategoryId: 1 });
		expect(result).toEqual({ productName: 'Gin', categoryId: 1 });
	});

	it('handles nested objects recursively', () => {
		const input = {
			RecipeName: 'Martini',
			RecipeDetails: {
				TechniqueId: 1,
				GlassType: 'coupe',
			},
		};
		const result = marshal(input);
		expect(result).toEqual({
			recipeName: 'Martini',
			recipeDetails: {
				techniqueId: 1,
				glassType: 'coupe',
			},
		});
	});

	it('handles arrays of objects', () => {
		const input = [
			{ ProductName: 'Gin', Proof: 94 },
			{ ProductName: 'Vermouth', Proof: 36 },
		];
		const result = marshal(input);
		expect(result).toEqual([
			{ productName: 'Gin', proof: 94 },
			{ productName: 'Vermouth', proof: 36 },
		]);
	});

	it('preserves Date instances', () => {
		const date = new Date('2024-01-01');
		const input = { CreatedAt: date };
		const result = marshal<{ createdAt: Date }>(input);
		expect(result.createdAt).toBe(date);
		expect(result.createdAt instanceof Date).toBe(true);
	});

	it('passes through primitives', () => {
		expect(marshal('hello')).toBe('hello');
		expect(marshal(42)).toBe(42);
		expect(marshal(null)).toBe(null);
		expect(marshal(undefined)).toBe(undefined);
	});

	it('converts to PascalCase with custom function', () => {
		const result = marshal({ productName: 'Gin', categoryId: 1 }, pascalCase);
		expect(result).toEqual({ ProductName: 'Gin', CategoryId: 1 });
	});
});

// ---- marshalToType ----

describe('marshalToType', () => {
	type Product = { productName: string; proof: number };

	it('converts keys and returns typed result', () => {
		const result = marshalToType<Product>({ ProductName: 'Bourbon', Proof: 90 });
		expect(result.productName).toBe('Bourbon');
		expect(result.proof).toBe(90);
	});

	it('handles null input', () => {
		const result = marshalToType<Product | null>(null);
		expect(result).toBe(null);
	});

	it('handles arrays', () => {
		const result = marshalToType<Product[]>([
			{ ProductName: 'Gin', Proof: 94 },
			{ ProductName: 'Rum', Proof: 80 },
		]);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ productName: 'Gin', proof: 94 });
	});
});
