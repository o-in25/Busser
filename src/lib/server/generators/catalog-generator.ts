import { z } from 'zod';

import { type IGenerator, LlmClient } from '../ai';

const schema = z.object({
	history: z.string(),
	flavorProfile: z.array(z.string()),
	goodWith: z.array(z.string()),
	avoidWith: z.array(z.string()),
});

export type CatalogGeneratorSchema = z.infer<typeof schema>;

export class CatalogGenerator
	extends LlmClient<CatalogGeneratorSchema>
	implements IGenerator<CatalogGeneratorSchema>
{
	constructor() {
		super(schema);
	}

	async generateContent(param: string): Promise<CatalogGeneratorSchema> {
		const prompt = `Tell me some facts about ${param}, including a brief history as well as a flavor profile. 
      The flavor profile could include information such as the sweetness, dryness, etc. 
      Also provide some ingredients (juices, liqueurs, etc) that pair well with 
      ${param} or popular ${param} cocktails as well some ingredients (juices, liqueurs, etc) 
      that do not pair well with ${param}.`;
		const result = await super.invoke(prompt);
		return result;
	}
}
