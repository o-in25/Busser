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
