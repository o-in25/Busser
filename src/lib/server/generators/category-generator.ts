import { z } from 'zod';

import { generateText } from '../ai';

const schema = z.object({
	description: z.string(),
});

export type CategoryGeneratorSchema = z.infer<typeof schema>;

export class CategoryGenerator {
	async generateContent(param: string): Promise<CategoryGeneratorSchema> {
		const prompt = `Write a concise 1-2 sentence description for a bar inventory category called "${param}".
Focus on what types of spirits, liqueurs, or ingredients belong in this category.
Keep it brief and descriptive - suitable for organizing a home bar inventory.
Return only plain text, no markdown or formatting.`;
		return generateText(prompt, schema);
	}
}
