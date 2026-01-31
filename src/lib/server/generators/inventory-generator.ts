import { z } from 'zod';

import { generateText } from '../ai';

const schema = z.object({
	description: z.string(),
});

export type InventoryGeneratorSchema = z.infer<typeof schema>;

export class InventoryGenerator {
	async generateContent(param: string): Promise<InventoryGeneratorSchema> {
		const prompt = `Provide me a brief product description of ${param}.`;
		return generateText(prompt, schema);
	}
}
