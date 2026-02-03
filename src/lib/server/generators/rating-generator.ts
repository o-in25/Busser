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

		const prompt = `You are a professional mixologist rating a cocktail recipe. Analyze the following cocktail and provide ratings from 1-10 for each characteristic.

COCKTAIL: ${input.recipeName}
${input.recipeDescription ? `DESCRIPTION: ${input.recipeDescription}` : ''}

INGREDIENTS:
${ingredientsList}

Rate the following characteristics on a scale of 1-10:

1. SWEETNESS (1 = bone dry, 10 = dessert-like sweet)
   Consider: sugar content, sweet liqueurs, fruit juices, simple syrup

2. DRYNESS (1 = no dry/bitter notes, 10 = very dry/bitter)
   Consider: dry vermouth, bitters, citrus peel, amaro, tannins
   Note: A drink can have moderate sweetness AND dryness (they're not opposites)

3. VERSATILITY (1 = very niche/acquired taste, 10 = crowd-pleaser)
   Consider: balance, accessibility, broad appeal, familiar flavors

4. STRENGTH (1 = very light/sessionable, 10 = very boozy)
   Consider: total alcohol content, proof of spirits, dilution from mixing

IMPORTANT GUIDELINES:
- Be realistic and varied in your ratings - not everything should be a 7
- Classic balanced cocktails (like a well-made Margarita) typically have moderate sweetness (4-6) and dryness (4-6)
- Shots and spirit-forward drinks should rate high on strength (8-10)
- Tiki drinks and dessert cocktails should rate higher on sweetness (7-9)
- Negronis and Manhattans should rate higher on dryness (6-8)
- Consider that high versatility usually means good balance (avoid extremes)

Return only the four numerical ratings.`;

		return generateText(prompt, schema);
	}
}
