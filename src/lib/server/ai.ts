import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { ZodSchema } from 'zod';
const { OPENAI_API_KEY } = process.env;

export abstract class LlmClient<T> {
	private openai: OpenAI = new OpenAI({ apiKey: OPENAI_API_KEY });
	protected schema: ZodSchema<T>;
	// protected prompt: string;

	constructor(schema: ZodSchema<T>) {
		this.schema = schema;
	}

	protected async invoke(prompt: string): Promise<T> {
		const completion = await this.openai.beta.chat.completions.parse({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: prompt,
				},
			],
			response_format: zodResponseFormat(this.schema, 'text'),
		});
		const structuredResult = completion.choices[0].message.parsed;
		return structuredResult as T;
	}
}

export interface IGenerator<T> {
	generateContent(param: string): Promise<T>;
}

// up next...

// export async function scanImage() {
//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       {
//         role: "user",
//         content: [
//           { type: "text", text: "What is the name of the bottle in the image and its size in milliliters?" },
//           {
//             type: "image_url",
//             image_url: {
//               "url": sampleImg,
//             },
//           },
//         ],
//       },
//     ],
