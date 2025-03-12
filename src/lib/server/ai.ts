
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
// import { env } from '$env/dynamic/private';

const { OPENAI_API_KEY } = { OPENAI_API_KEY: ''};
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

let sampleImg = 'https://media.liquormax.com/eq4rxnkvcouvc1anfqqhe/stoli-l.jpg'
sampleImg = 'https://cdn.shoplightspeed.com/shops/636686/files/24395938/rittenhouse-100-proof-rye-750-ml.jpg'
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
  const image = await openai.images.generate({ model: "dall-e-3", prompt: "Small SVG of a user avatar for a website nav bar. Incorporate a color theme of neon pinks, purples, light blues. It should look modern and sleek -- yet have an unfamiliar retro-futuristic vibe. Most importantly, it should be VERY minimalistic. Prefer just solid colors over complex shapes.", n: 1 });
  console.log(image)
  return image.data;


}

export async function scanImage() {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What is the name of the bottle in the image and its size in milliliters?" },
          {
            type: "image_url",
            image_url: {
              "url": sampleImg,
            },
          },
        ],
      },
    ],
  });
  console.log(response.choices[0]);
}