import crypto from "crypto";

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
export const dilutionByStirred = (abv: number) =>
  -1.21 * Math.pow(abv, 2) + 1.246 * abv + 0.145;

// Dilution of a shaken drink shaken with 120 grams of ¼-inch cubes for 10 seconds:
export const dilutionByShaken = (abv: number) =>
  1.567 * Math.pow(abv, 2) + 1.742 * abv + 0.203;

// Dry shake approximation: ~70% of normal shake dilution (no ice first pass)
export const dilutionByDryShake = (abv: number) => dilutionByShaken(abv) * 0.7;

// Whip shake: ~40% of normal shake dilution (small ice piece shaken until melted)
export const dilutionByWhipShake = (abv: number) => dilutionByShaken(abv) * 0.4;

type DilutionMethod =
  | "stirred"
  | "shaken"
  | "dry_shake"
  | "whip_shake"
  | "built"
  | "blended";

// map technique IDs to dilution method names
// update these IDs to match your database
const techniqueIdToMethod: Record<number, DilutionMethod> = {
  1: "stirred",
  2: "shaken",
  3: "built",
  4: "dry_shake",
  5: "whip_shake",
  6: "blended",
};

export const getMethodFromTechniqueId = (id: number): DilutionMethod =>
  techniqueIdToMethod[id] || "shaken";

// Calculate dilution amount in ml based on volume and ABV
export const calculateDilutionMl = (
  volumeMl: number,
  abvDecimal: number,
  method: DilutionMethod,
) => {
  let dilutionPercent: number;
  switch (method) {
    case "stirred":
      dilutionPercent = dilutionByStirred(abvDecimal);
      break;
    case "dry_shake":
      dilutionPercent = dilutionByDryShake(abvDecimal);
      break;
    case "whip_shake":
      dilutionPercent = dilutionByWhipShake(abvDecimal);
      break;
    case "built":
      // built drinks have minimal dilution from ice melt over time
      dilutionPercent = 0.1;
      break;
    case "blended":
      // blended drinks have high dilution from crushed ice
      dilutionPercent = dilutionByShaken(abvDecimal) * 1.2;
      break;
    default:
      dilutionPercent = dilutionByShaken(abvDecimal);
  }
  return volumeMl * dilutionPercent;
};

const units: Record<
  string,
  {
    toMl: number;
    fromMl: (ml: number) => number;
    i18n: (qty: number) => string;
  }
> = {
  ml: {
    toMl: 1,
    fromMl: (ml) => ml,
    i18n: (qty: number) => (qty === 1 ? "ml" : "ml"),
  },
  oz: {
    toMl: 30,
    fromMl: (ml: number) => ml / 30,
    i18n: (qty: number) => (qty === 1 ? "oz" : "oz"),
  },
  dash: {
    toMl: 0.92,
    fromMl: (ml: number) => Math.round(ml / 0.92),
    i18n: (qty: number) => (Math.round(qty) === 1 ? "dash" : "dashes"),
  },
  cube: {
    toMl: 2.5,
    fromMl: (ml: number) => ml / 2.5,
    i18n: (qty: number) => (qty === 1 ? "cube" : "cubes"),
  },
  tsp: {
    toMl: 5,
    fromMl: (ml: number) => ml / 5,
    i18n: (qty: number) => (qty === 1 ? "tsp" : "tsp"),
  },
  tbsp: {
    toMl: 15,
    fromMl: (ml: number) => ml / 15,
    i18n: (qty: number) => (qty === 1 ? "tbsp" : "tbsp"),
  },
  "top off": {
    toMl: 30,
    fromMl: (ml: number) => ml / 30,
    i18n: () => "top off",
  },
};

export const weightedMean = (arrValues: number[], arrWeights: number[]) => {
  const result = arrValues
    .map((value, i) => {
      const weight = arrWeights[i];
      const sum = value * weight;
      return [sum, weight];
    })
    .reduce((p, c) => [p[0] + c[0], p[1] + c[1]], [0, 0]);

  return result[0] / result[1];
};

export const calculateOverallScore = (
  versatility: number,
  sweetness: number,
  dryness: number,
  strength: number,
) => {
  if (![versatility, sweetness, dryness, strength].some((val) => val > 0))
    return 0;

  const weights = {
    versatility: 0.4,
    sweetnessDrynessRatio: 0.3,
    strength: 0.3,
  };
  let totalScore =
    versatility * weights.versatility +
    ((sweetness + dryness) / 2) * weights.sweetnessDrynessRatio +
    strength * weights.strength;
  totalScore +=
    (sweetness > 7 && dryness > 7 ? -0.1 : 0) +
    (sweetness > 7 && dryness > 7 ? -0.1 : 0) +
    (strength > 7 && (versatility < 5 || (sweetness + dryness) / 2 < 5)
      ? -0.1
      : 0);
  totalScore = Math.min(Math.max(totalScore, 0), 10);

  return totalScore;
};

export const calculateAbv = (
  recipeSteps: {
    productIdQuantityInMilliliters: number;
    productProof: number;
  }[],
  recipeTechniqueDescriptionId: number,
) => {
  // total volume in ml
  const volume = recipeSteps.reduce(
    (acc, { productIdQuantityInMilliliters }) =>
      acc + productIdQuantityInMilliliters,
    0,
  );

  // total alcohol in ml
  const alcoholMl = recipeSteps.reduce(
    (acc, { productProof, productIdQuantityInMilliliters }) => {
      acc += (productProof / 2 / 100) * productIdQuantityInMilliliters;
      return acc;
    },
    0,
  );

  // abv before dilution
  const abvDecimal = volume > 0 ? alcoholMl / volume : 0;

  // calculate dilution based on technique
  const method = getMethodFromTechniqueId(recipeTechniqueDescriptionId);
  const dilutionMl = calculateDilutionMl(volume, abvDecimal, method);

  // final abv after dilution
  const finalVolume = volume + dilutionMl;
  const finalAbv = finalVolume > 0 ? (alcoholMl / finalVolume) * 100 : 0;

  return `${finalAbv.toFixed(0)}% abv`;
};

// Helper to get dilution info for display
export const getDilutionInfo = (
  recipeSteps: {
    productIdQuantityInMilliliters: number;
    productProof: number;
  }[],
  recipeTechniqueDescriptionId: number,
) => {
  const volume = recipeSteps.reduce(
    (acc, { productIdQuantityInMilliliters }) =>
      acc + productIdQuantityInMilliliters,
    0,
  );

  const alcoholMl = recipeSteps.reduce(
    (acc, { productProof, productIdQuantityInMilliliters }) => {
      acc += (productProof / 2 / 100) * productIdQuantityInMilliliters;
      return acc;
    },
    0,
  );

  const abvDecimal = volume > 0 ? alcoholMl / volume : 0;
  const method = getMethodFromTechniqueId(recipeTechniqueDescriptionId);
  const dilutionMl = calculateDilutionMl(volume, abvDecimal, method);

  return {
    volumeMl: volume,
    dilutionMl,
    finalVolumeMl: volume + dilutionMl,
    dilutionOz: dilutionMl / 30,
    method,
  };
};

export const convertToMl = (unit: string, value: number) =>
  value * units[unit].toMl;
export const convertFromMl = (unit: string, value: number) =>
  units[unit].fromMl(value);
export const getUnits = () => units;

export function generateSecureCode(length = 6) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => charset[b % charset.length]).join("");
}

// BAC Calculator Constants
export const WIDMARK_R_MALE = 0.68;
export const WIDMARK_R_FEMALE = 0.55;
export const METABOLISM_RATE = 0.015; // per hour
export const ALCOHOL_DENSITY = 0.789; // g/ml

// Calculate pure alcohol in grams from recipe steps
export const calculateAlcoholGrams = (
  recipeSteps: {
    productIdQuantityInMilliliters: number;
    productProof: number;
  }[],
  _recipeTechniqueDescriptionId?: number,
): number => {
  // total alcohol in ml (proof / 2 = ABV%, then divide by 100 for decimal)
  const alcoholMl = recipeSteps.reduce(
    (acc, { productProof, productIdQuantityInMilliliters }) => {
      acc += (productProof / 2 / 100) * productIdQuantityInMilliliters;
      return acc;
    },
    0,
  );

  // The alcohol ml stays constant - dilution only adds water
  // We care about total alcohol consumed, not final concentration
  // Convert alcohol ml to grams using density
  return alcoholMl * ALCOHOL_DENSITY;
};

// Calculate BAC using Widmark formula
// BAC = (A / (W * r)) - (β * t)
// A = alcohol in grams, W = body weight in grams, r = Widmark factor, β = metabolism rate, t = hours
export const calculateBac = (
  alcoholGrams: number,
  bodyWeightKg: number,
  gender: "male" | "female",
  hoursSinceDrinking: number,
): number => {
  const widmarkFactor = gender === "male" ? WIDMARK_R_MALE : WIDMARK_R_FEMALE;
  const bodyWeightGrams = bodyWeightKg * 1000;

  // Calculate BAC before metabolism
  const bacBeforeMetabolism =
    (alcoholGrams / (bodyWeightGrams * widmarkFactor)) * 100;

  // Subtract metabolism over time
  const bac = bacBeforeMetabolism - METABOLISM_RATE * hoursSinceDrinking;

  // BAC cannot go below 0
  return Math.max(0, bac);
};

// Get impairment level description
export const getImpairmentLevel = (
  bac: number,
): {
  level: string;
  description: string;
  color: "green" | "yellow" | "orange" | "red";
} => {
  if (bac === 0) {
    return {
      level: "Sober",
      description: "No alcohol detected",
      color: "green",
    };
  }
  if (bac < 0.02) {
    return {
      level: "Minimal",
      description: "Little to no impairment",
      color: "green",
    };
  }
  if (bac < 0.05) {
    return {
      level: "Light",
      description: "Mild relaxation, slight impairment of judgment",
      color: "yellow",
    };
  }
  if (bac < 0.08) {
    return {
      level: "Moderate",
      description: "Reduced coordination, impaired judgment",
      color: "orange",
    };
  }
  if (bac < 0.15) {
    return {
      level: "Significant",
      description: "Above legal limit - significant impairment",
      color: "red",
    };
  }
  if (bac < 0.3) {
    return {
      level: "Severe",
      description: "Severe impairment - danger of blackout",
      color: "red",
    };
  }
  return {
    level: "Lethal",
    description: "Life-threatening - seek medical attention",
    color: "red",
  };
};

// Estimate time until sober (BAC reaches 0)
export const estimateTimeUntilSober = (currentBac: number): number => {
  if (currentBac <= 0) return 0;
  // Time = BAC / metabolism rate
  return currentBac / METABOLISM_RATE;
};
