import { ZodSchema } from "zod";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
const { OPENAI_API_KEY } = process.env;

export class LlmClient<T> {
  private openai: OpenAI = new OpenAI({ apiKey: OPENAI_API_KEY });
  protected schema: ZodSchema<T>;
  // protected prompt: string;

  constructor(schema: ZodSchema<T>) {
    this.schema = schema;
  }

  protected async invoke(prompt: string): Promise<T> {
      const completion = await this.openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt
          },
        ],
        response_format: zodResponseFormat(this.schema, 'page_content')
      });
      
      const structuredResult = completion.choices[0].message.parsed;
      return structuredResult as T;
  }
} 

export interface IGenerator<T> {
  generateContent(param: string): Promise<T>;
}