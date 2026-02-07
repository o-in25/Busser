import { describe, it, expect } from 'vitest';

import {
	dilutionByStirred,
	dilutionByShaken,
	dilutionByDryShake,
	dilutionByWhipShake,
	getMethodFromTechniqueId,
	calculateDilutionMl,
	weightedMean,
	calculateOverallScore,
	calculateAbv,
	getDilutionInfo,
	convertToMl,
	convertFromMl,
} from '$lib/math';

// ---- dilution formulas ----

describe('dilution formulas', () => {
	it('dilutionByStirred returns expected values', () => {
		expect(dilutionByStirred(0)).toBeCloseTo(0.145, 3);
		expect(dilutionByStirred(0.2)).toBeCloseTo(-1.21 * 0.04 + 1.246 * 0.2 + 0.145, 5);
		expect(dilutionByStirred(0.4)).toBeCloseTo(-1.21 * 0.16 + 1.246 * 0.4 + 0.145, 5);
	});

	it('dilutionByShaken returns expected values', () => {
		expect(dilutionByShaken(0)).toBeCloseTo(0.203, 3);
		expect(dilutionByShaken(0.2)).toBeCloseTo(1.567 * 0.04 + 1.742 * 0.2 + 0.203, 5);
		expect(dilutionByShaken(0.4)).toBeCloseTo(1.567 * 0.16 + 1.742 * 0.4 + 0.203, 5);
	});

	it('dilutionByDryShake is 70% of shaken', () => {
		for (const abv of [0, 0.15, 0.3, 0.45]) {
			expect(dilutionByDryShake(abv)).toBeCloseTo(dilutionByShaken(abv) * 0.7, 10);
		}
	});

	it('dilutionByWhipShake is 40% of shaken', () => {
		for (const abv of [0, 0.15, 0.3, 0.45]) {
			expect(dilutionByWhipShake(abv)).toBeCloseTo(dilutionByShaken(abv) * 0.4, 10);
		}
	});
});

// ---- technique ID mapping ----

describe('getMethodFromTechniqueId', () => {
	it('maps IDs 1-6 correctly', () => {
		expect(getMethodFromTechniqueId(1)).toBe('stirred');
		expect(getMethodFromTechniqueId(2)).toBe('shaken');
		expect(getMethodFromTechniqueId(3)).toBe('built');
		expect(getMethodFromTechniqueId(4)).toBe('dry_shake');
		expect(getMethodFromTechniqueId(5)).toBe('whip_shake');
		expect(getMethodFromTechniqueId(6)).toBe('blended');
	});

	it('returns shaken for unknown IDs', () => {
		expect(getMethodFromTechniqueId(99)).toBe('shaken');
		expect(getMethodFromTechniqueId(0)).toBe('shaken');
	});
});

// ---- calculateDilutionMl ----

describe('calculateDilutionMl', () => {
	const volume = 100;
	const abv = 0.2;

	it('routes to stirred formula', () => {
		const expected = volume * dilutionByStirred(abv);
		expect(calculateDilutionMl(volume, abv, 'stirred')).toBeCloseTo(expected, 5);
	});

	it('routes to shaken formula', () => {
		const expected = volume * dilutionByShaken(abv);
		expect(calculateDilutionMl(volume, abv, 'shaken')).toBeCloseTo(expected, 5);
	});

	it('routes to dry_shake formula', () => {
		const expected = volume * dilutionByDryShake(abv);
		expect(calculateDilutionMl(volume, abv, 'dry_shake')).toBeCloseTo(expected, 5);
	});

	it('routes to whip_shake formula', () => {
		const expected = volume * dilutionByWhipShake(abv);
		expect(calculateDilutionMl(volume, abv, 'whip_shake')).toBeCloseTo(expected, 5);
	});

	it('built returns 10% dilution', () => {
		expect(calculateDilutionMl(volume, abv, 'built')).toBeCloseTo(volume * 0.1, 5);
	});

	it('blended returns 120% of shaken', () => {
		const expected = volume * dilutionByShaken(abv) * 1.2;
		expect(calculateDilutionMl(volume, abv, 'blended')).toBeCloseTo(expected, 5);
	});
});

// ---- weightedMean ----

describe('weightedMean', () => {
	it('computes weighted mean correctly', () => {
		expect(weightedMean([10, 20], [1, 3])).toBeCloseTo(17.5, 5);
	});

	it('equal weights behaves like arithmetic mean', () => {
		expect(weightedMean([4, 8, 12], [1, 1, 1])).toBeCloseTo(8, 5);
	});

	it('single value returns that value', () => {
		expect(weightedMean([5], [2])).toBeCloseTo(5, 5);
	});
});

// ---- calculateOverallScore ----

describe('calculateOverallScore', () => {
	it('returns 0 when all inputs are 0', () => {
		expect(calculateOverallScore(0, 0, 0, 0)).toBe(0);
	});

	it('applies parabolic scoring formula correctly', () => {
		// versatility=10, sweetness=5 (ideal), dryness=5 (ideal), strength=6 (ideal)
		// versatilityScore = 10 * 0.5 = 5
		// sweetness/dryness at ideal → 1.5 each, strength at ideal → 1.5
		// total = 5 + 1.5 + 1.5 + 1.5 = 9.5
		expect(calculateOverallScore(10, 5, 5, 6)).toBeCloseTo(9.5, 1);

		// strength far from ideal (10) reduces strength contribution
		const score = calculateOverallScore(10, 5, 5, 10);
		expect(score).toBeGreaterThan(8);
		expect(score).toBeLessThan(9.5);
	});

	it('applies penalty when sweetness and dryness both > 7', () => {
		const noPenalty = calculateOverallScore(5, 7, 7, 5);
		const withPenalty = calculateOverallScore(5, 8, 8, 5);
		// sweetness=7, dryness=7 → not > 7, no penalty
		// sweetness=8, dryness=8 → both > 7, -1 penalty
		expect(withPenalty).toBeLessThan(noPenalty);
	});

	it('clamps result to 0-10 range', () => {
		expect(calculateOverallScore(10, 10, 10, 10)).toBeLessThanOrEqual(10);
		expect(calculateOverallScore(0, 0, 0, 0)).toBeGreaterThanOrEqual(0);
	});
});

// ---- calculateAbv ----

describe('calculateAbv', () => {
	it('returns "0% abv" for no-alcohol recipe', () => {
		const steps = [
			{ productIdQuantityInMilliliters: 60, productProof: 0 },
			{ productIdQuantityInMilliliters: 30, productProof: 0 },
		];
		expect(calculateAbv(steps, 2)).toBe('0% abv');
	});

	it('calculates correctly for a stirred whiskey drink', () => {
		// 60ml of 100-proof (50% abv) whiskey, stirred (technique 1)
		const steps = [{ productIdQuantityInMilliliters: 60, productProof: 100 }];
		const result = calculateAbv(steps, 1);
		// alcohol = 60 * 0.5 = 30ml
		// abv = 30/60 = 0.5
		// dilution = dilutionByStirred(0.5) * 60
		const dilution = dilutionByStirred(0.5) * 60;
		const finalVol = 60 + dilution;
		const finalAbv = (30 / finalVol) * 100;
		expect(result).toBe(`${finalAbv.toFixed(0)}% abv`);
	});

	it('accounts for dilution reducing final ABV', () => {
		const steps = [{ productIdQuantityInMilliliters: 60, productProof: 80 }];
		// same recipe, compare stirred vs shaken — shaken should dilute more
		const stirred = calculateAbv(steps, 1);
		const shaken = calculateAbv(steps, 2);
		const stirredNum = parseFloat(stirred);
		const shakenNum = parseFloat(shaken);
		expect(stirredNum).toBeGreaterThan(shakenNum);
	});
});

// ---- getDilutionInfo ----

describe('getDilutionInfo', () => {
	it('returns correct dilution info', () => {
		const steps = [
			{ productIdQuantityInMilliliters: 60, productProof: 80 },
			{ productIdQuantityInMilliliters: 30, productProof: 0 },
		];
		const info = getDilutionInfo(steps, 2); // shaken

		expect(info.volumeMl).toBe(90);
		expect(info.method).toBe('shaken');

		// alcohol = 60 * 0.4 = 24ml, abv = 24/90
		const abv = 24 / 90;
		const expectedDilution = calculateDilutionMl(90, abv, 'shaken');
		expect(info.dilutionMl).toBeCloseTo(expectedDilution, 5);
		expect(info.finalVolumeMl).toBeCloseTo(90 + expectedDilution, 5);
	});

	it('uses correct method from technique ID', () => {
		const steps = [{ productIdQuantityInMilliliters: 60, productProof: 80 }];
		expect(getDilutionInfo(steps, 1).method).toBe('stirred');
		expect(getDilutionInfo(steps, 3).method).toBe('built');
		expect(getDilutionInfo(steps, 6).method).toBe('blended');
	});
});

// ---- unit conversions ----

describe('unit conversions', () => {
	it('convertToMl converts oz correctly', () => {
		expect(convertToMl('oz', 1)).toBe(30);
		expect(convertToMl('oz', 2)).toBe(60);
	});

	it('convertToMl converts dash correctly', () => {
		expect(convertToMl('dash', 1)).toBeCloseTo(0.92, 2);
	});

	it('convertToMl converts other units', () => {
		expect(convertToMl('ml', 1)).toBe(1);
		expect(convertToMl('tsp', 1)).toBe(5);
		expect(convertToMl('tbsp', 1)).toBe(15);
		expect(convertToMl('cube', 1)).toBe(2.5);
	});

	it('convertFromMl converts correctly', () => {
		expect(convertFromMl('oz', 30)).toBe(1);
		expect(convertFromMl('oz', 60)).toBe(2);
		expect(convertFromMl('tsp', 5)).toBe(1);
		expect(convertFromMl('ml', 100)).toBe(100);
	});

	it('round-trip conversion preserves values', () => {
		for (const unit of ['oz', 'ml', 'tsp', 'tbsp', 'cube']) {
			const original = 3;
			const ml = convertToMl(unit, original);
			const back = convertFromMl(unit, ml);
			expect(back).toBeCloseTo(original, 5);
		}
	});

	it('dash round-trip uses integer rounding', () => {
		// dash fromMl rounds to integer
		const ml = convertToMl('dash', 3);
		const back = convertFromMl('dash', ml);
		expect(back).toBe(3);
	});
});
