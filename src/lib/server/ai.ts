
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { OPENAI_API_KEY } from "$env/static/private";
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export type ImageData = {
  url: string
}

export type GeneratedContent = {
  history: string,
  flavorProfile: string[],
  goodWith: string[],
  avoidWith: string[];
}

// trying to avoid injection

export const buildPrompt = (param: string) => {

  return `Tell me some facts about ${param}, including a brief history as well as a flavor profile. 
    The flavor profile could include information such as the sweetness, dryness, etc. 
    Also provide some ingredients (juices, liqueurs, etc) that pair well with 
    ${param} or popular ${param} cocktails as well some ingredients (juices, liqueurs, etc) 
    that do not pair well with ${param}.`
}

export async function generateContent(prompt: string): Promise<GeneratedContent> {
  const schema = z.object({
    history: z.string(),
    flavorProfile: z.array(z.string()),
    goodWith: z.array(z.string()),
    avoidWith: z.array(z.string())
  });

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt
      },
    ],
    response_format: zodResponseFormat(schema, 'page_content')
  });
  
  const structuredResult = completion.choices[0].message.parsed;
  return structuredResult as GeneratedContent;
}

export async function generateImage() {
  const image = await openai.images.generate({ model: "dall-e-3", prompt: "Pictures of Gin in glasses and bottles.", n: 1 });

  return image.data;

}
