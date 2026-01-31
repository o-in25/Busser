import { z } from 'zod';

import { generateText } from '../ai';

const schema = z.object({
	description: z.string(),
});

export type RecipeGeneratorSchema = z.infer<typeof schema>;

export class RecipeGenerator {
	async generateContent(param: string): Promise<RecipeGeneratorSchema> {
		const prompt = `Tell me some facts about the ${param} cocktail, including a brief history as well as a flavor profile.
      The flavor profile could include information such as the sweetness, dryness, etc. Keep the summary fairly brief. Return only plain text. No markdown, no formatting.`;
		return generateText(prompt, schema);
	}
}
