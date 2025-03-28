
// From Liquid Intelligence by Dave Arnold
/*
  After lots of testing, I came up with an equation to estimate dilution from
  stirring and shaking that takes only initial alcohol content into
  consideration. It works well for the range of alcohol content in cocktails. I
  discovered that I could safely ignore sugar content. In these equations,
  alcohol by volume must be input as a decimal (22 percent would be 0.22)
  and dilution is returned as a decimal percent. I derived these equations by
  measuring a series of cocktails and using Excel to fit a curve to my data.
*/

// Dilution of a stirred drink stirred quickly with 120 grams of ¼-inch cubes for 15 seconds
export const dilutionByStirred = (abv: number) => -1.21 * Math.pow(abv, 2) + 1.246 * abv + 0.145;

// Dilution of a shaken drink shaken with 120 grams of ¼-inch cubes for 10 seconds:
export const dilutionByShaken = (abv: number) => 1.567 * Math.pow(abv, 2) + 1.742 * abv + 0.203;

export const weightedMean = (arrValues: number[], arrWeights: number[]) => {
  const result = arrValues
    .map((value, i) => {
      const weight = arrWeights[i]
      const sum = value * weight
      return [sum, weight]
    })
    .reduce((p, c) => [p[0] + c[0], p[1] + c[1]], [0, 0])

  return result[0] / result[1]
}


export const calculateOverallScore = (versatility: number, sweetness: number, dryness: number, strength: number) =>{
  if(![versatility, sweetness, dryness, strength].some(val => val > 0)) return 0;

  const weights = {
    versatility: 0.40,
    sweetnessDrynessRatio: 0.30,
    strength: 0.30
  }
  let totalScore = (versatility * weights.versatility) +
                   (((sweetness + dryness) / 2) * weights.sweetnessDrynessRatio) +
                   (strength * weights.strength);
  totalScore += ((sweetness > 7 && dryness > 7) ? -0.1 : 0) + ((sweetness > 7 && dryness > 7) ? -0.1 : 0) + ((strength > 7 && (versatility < 5 || ((sweetness + dryness) / 2) < 5)) ? -0.1 : 0);
  totalScore = Math.min(Math.max(totalScore, 0), 10);

  return totalScore;
}

export const calculateAbv = (recipeSteps: { productIdQuantityInMilliliters: number, productProof: number}[], recipeTechniqueDescriptionId: number) => {
  // in ml
  let volume = recipeSteps.reduce(
    (acc, {productIdQuantityInMilliliters}) =>
      acc + productIdQuantityInMilliliters,
    0
  );
  let abv = recipeSteps.reduce(
    (acc, {productProof, productIdQuantityInMilliliters}) => {
      acc += (productProof / 2 / 100) * productIdQuantityInMilliliters;
      return acc;
    },
    0
  );

  if (recipeTechniqueDescriptionId === 1) {
    volume += dilutionByStirred(abv / 100);
  } else {
    // TODO: we don't have a formula for dry shakes
    volume += dilutionByShaken(abv / 100);
  }
  let total = abv / volume;
  total = (Math.ceil(total * 100) / 100) * 100;
  return `${total.toFixed(0)}% abv`;
};