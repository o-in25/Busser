import spiritsData from '$lib/data/spirits.json';
import type { SpiritSlug, SpiritContent } from '$lib/types';

export const spirits = spiritsData as Record<SpiritSlug, SpiritContent>;

export const validSlugs = Object.keys(spirits) as SpiritSlug[];

export const slugToId = Object.fromEntries(
	Object.entries(spirits).map(([slug, s]) => [slug, s.recipeCategoryId])
) as Record<SpiritSlug, number>;

export const idToSlug = Object.fromEntries(
	Object.entries(spirits).map(([slug, s]) => [s.recipeCategoryId, slug])
) as Record<number, SpiritSlug>;

type TasteRatings = {
	recipeSweetnessRating: number;
	recipeDrynessRating: number;
	recipeStrengthRating: number;
	recipeVersatilityRating: number;
};

export type Mood = {
	id: string;
	label: string;
	test: (d: TasteRatings) => boolean;
};

export const moods: Mood[] = [
	{
		id: 'strong-dry',
		label: 'Strong & Dry',
		test: (d) => d.recipeStrengthRating >= 6 && d.recipeDrynessRating >= 6,
	},
	{
		id: 'sweet-easy',
		label: 'Sweet & Easy',
		test: (d) => d.recipeSweetnessRating >= 6 && d.recipeStrengthRating <= 5,
	},
	{
		id: 'balanced',
		label: 'Balanced',
		test: (d) => {
			const vals = [
				d.recipeSweetnessRating,
				d.recipeDrynessRating,
				d.recipeStrengthRating,
				d.recipeVersatilityRating,
			];
			const mean = vals.reduce((a, b) => a + b, 0) / 4;
			return vals.every((v) => Math.abs(v - mean) <= 2.5);
		},
	},
	{
		id: 'bold-complex',
		label: 'Bold & Complex',
		test: (d) => d.recipeStrengthRating >= 6 && d.recipeVersatilityRating >= 6,
	},
];
