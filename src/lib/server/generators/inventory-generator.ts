import { z } from "zod";
import { LlmClient, type IGenerator } from "../ai";

const schema = z.object({
  description: z.string()
});

export type InventoryGeneratorSchema = z.infer<typeof schema>;

export class InventoryGenerator extends LlmClient<InventoryGeneratorSchema> implements IGenerator<InventoryGeneratorSchema> {
  constructor() {
    super(schema);
  }


  async generateContent(param: string): Promise<InventoryGeneratorSchema> {
    const prompt = `Provide me a brief product description of ${param}. `
    const result = await super.invoke(prompt);
    return result;
  }

}