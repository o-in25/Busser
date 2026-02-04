import { z } from 'zod';

import { generateText } from '../ai';

const schema = z.object({
	sweetnessRating: z.number().min(1).max(10),
	drynessRating: z.number().min(1).max(10),
	versatilityRating: z.number().min(1).max(10),
	strengthRating: z.number().min(1).max(10),
});

export type RatingGeneratorSchema = z.infer<typeof schema>;

export type RatingGeneratorInput = {
	recipeName: string;
	recipeDescription?: string;
	ingredients: Array<{
		name: string;
		quantity: number;
		unit: string;
		proof?: number;
	}>;
};

export class RatingGenerator {
	async generateRatings(input: RatingGeneratorInput): Promise<RatingGeneratorSchema> {
		const ingredientsList = input.ingredients
			.map((i) => `- ${i.quantity} ${i.unit} ${i.name}${i.proof ? ` (${i.proof} proof)` : ''}`)
			.join('\n');

		const ingredientCount = input.ingredients.length;

		const prompt = `You are a professional mixologist rating a cocktail recipe. Analyze the following cocktail and provide ratings from 1-10 for each characteristic.

COCKTAIL: ${input.recipeName}
${input.recipeDescription ? `DESCRIPTION: ${input.recipeDescription}` : ''}

INGREDIENTS (${ingredientCount} total):
${ingredientsList}

Rate the following characteristics on a scale of 1-10:

1. SWEETNESS (1 = no sweetness, 10 = dessert-like sweet)
   Consider: sugar content, sweet liqueurs, fruit juices, simple syrup
   Note: Rate what you taste, not what's ideal. A Piña Colada is legitimately 8-9 sweet.

2. DRYNESS (1 = no dry/bitter notes, 10 = very dry/bitter)
   Consider: dry vermouth, bitters, citrus peel, amaro, tannins
   Note: A drink can have both sweetness AND dryness (they're not opposites). A Negroni is both bitter and slightly sweet.

3. VERSATILITY - THIS IS THE MOST IMPORTANT RATING. It measures how adaptable and foundational the drink is:

   High versatility (8-10) means:
   - Ingredients can be easily substituted (e.g., Old Fashioned works with bourbon, rye, or any whiskey)
   - The drink is a "template" that has spawned many variations (e.g., Daiquiri → Strawberry Daiquiri, Banana Daiquiri)
   - Fewer ingredients = fewer "moving parts" = more room for experimentation
   - The drink inspired other cocktails (e.g., Martini inspired Espresso Martini, Pornstar Martini)

   Low versatility (1-4) means:
   - Requires very specific, hard-to-substitute ingredients (e.g., Ramos Gin Fizz needs orange flower water, heavy cream, egg white)
   - Changing ingredients fundamentally changes the drink into something else
   - The drink is a "destination" rather than a "template" - enjoyed as-is, not experimented with
   - More complex ingredient lists with specialized components

   EXAMPLES (be generous for true classics):
   - Old Fashioned: 10 (THE foundational whiskey cocktail, works with any whiskey, spawned Manhattan, countless variations)
   - Daiquiri: 10 (THE foundational rum sour, template for endless fruit variations, 3 simple ingredients)
   - Martini: 10 (THE foundational gin cocktail, inspired dozens of "-tini" drinks, infinitely customizable)
   - Margarita: 9-10 (foundational tequila sour, many variations, simple base)
   - Whiskey Sour: 9-10 (foundational sour template)
   - Moscow Mule: 8 (spawned many "mule" variations, simple template)
   - Negroni: 7-8 (equal parts template, Boulevardier variation, some flexibility)
   - Mai Tai: 6-7 (specific ingredients but some rum flexibility)
   - Espresso Martini: 4-5 (requires espresso specifically, modern drink, not a true template)
   - Ramos Gin Fizz: 2-3 (requires exact ingredients, orange flower water, no real variations)
   - Pisco Sour: 3-4 (requires pisco specifically, egg white technique)
   - Last Word: 3-4 (equal parts of 4 specific ingredients, changing one changes the drink entirely)

4. STRENGTH (1 = very light/sessionable, 10 = very boozy)
   Consider: total alcohol content, proof of spirits, dilution from mixing

IMPORTANT GUIDELINES:
- Be realistic and varied in your ratings - not everything should be a 7
- Versatility is weighted most heavily in the overall score, so be thoughtful and discriminating
- Reserve 9-10 versatility for true foundational template drinks only
- Modern/craft cocktails with specific ingredients typically rate 3-6 on versatility
- Drinks with 5+ ingredients are usually less versatile (more can go wrong)
- Classic balanced cocktails typically have moderate sweetness (4-6) and dryness (4-6)
- Shots and spirit-forward drinks should rate high on strength (8-10)
- Tiki drinks and dessert cocktails should rate higher on sweetness (7-9)

Return only the four numerical ratings.`;

		return generateText(prompt, schema);
	}
}
