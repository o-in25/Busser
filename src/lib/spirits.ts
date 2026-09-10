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

type Condition = { field: keyof TasteRatings; op: '>=' | '<='; value: number };

export type Mood = {
	id: string;
	label: string;
	test: (d: TasteRatings) => boolean;
	sql: (alias?: string) => string;
};

function conjunction(conditions: Condition[]): Pick<Mood, 'test' | 'sql'> {
	return {
		test: (d) =>
			conditions.every((c) => (c.op === '>=' ? d[c.field] >= c.value : d[c.field] <= c.value)),
		sql: (alias = 'r') =>
			'(' + conditions.map((c) => `${alias}.${c.field} ${c.op} ${c.value}`).join(' AND ') + ')',
	};
}

export const moods: Mood[] = [
	{
		id: 'strong-dry',
		label: 'Strong & Dry',
		...conjunction([
			{ field: 'recipeStrengthRating', op: '>=', value: 6 },
			{ field: 'recipeDrynessRating', op: '>=', value: 6 },
		]),
	},
	{
		id: 'sweet-easy',
		label: 'Sweet & Easy',
		...conjunction([
			{ field: 'recipeSweetnessRating', op: '>=', value: 6 },
			{ field: 'recipeStrengthRating', op: '<=', value: 5 },
		]),
	},
	{
		// mean distance rule
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
		sql: (alias = 'r') => {
			const s = `${alias}.recipeSweetnessRating`;
			const d = `${alias}.recipeDrynessRating`;
			const st = `${alias}.recipeStrengthRating`;
			const v = `${alias}.recipeVersatilityRating`;
			const mean = `((${s} + ${d} + ${st} + ${v}) / 4)`;
			return `(ABS(${s} - ${mean}) <= 2.5 AND ABS(${d} - ${mean}) <= 2.5 AND ABS(${st} - ${mean}) <= 2.5 AND ABS(${v} - ${mean}) <= 2.5)`;
		},
	},
	{
		id: 'bold-complex',
		label: 'Bold & Complex',
		...conjunction([
			{ field: 'recipeStrengthRating', op: '>=', value: 6 },
			{ field: 'recipeVersatilityRating', op: '>=', value: 6 },
		]),
	},
];
