import { z } from "zod";
import { LlmClient, type IGenerator } from "../ai";

const schema = z.object({
  description: z.string(),
});

export type RecipeGeneratorSchema = z.infer<typeof schema>;

export class RecipeGenerator extends LlmClient<RecipeGeneratorSchema> implements IGenerator<RecipeGeneratorSchema> {
  constructor() {
    super(schema);
  }


  async generateContent(param: string): Promise<RecipeGeneratorSchema> {
    const prompt = `Tell me some facts about the ${param} cocktail, including a brief history as well as a flavor profile. 
      The flavor profile could include information such as the sweetness, dryness, etc. Keep the summary fairly brief. Return only plain text. No markdown, no formatting.`;
    const result = await super.invoke(prompt);
    return result;
  }

}