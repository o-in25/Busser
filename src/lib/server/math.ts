
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
const dilutionByStirred = (abv: number) => -1.21 * Math.pow(abv, 2) + 1.246 * abv + 0.145;

// Dilution of a shaken drink shaken with 120 grams of ¼-inch cubes for 10 seconds:
const dilutionByShaken = (abv: number) => 1.567 * Math.pow(abv, 2) + 1.742 * abv + 0.203;