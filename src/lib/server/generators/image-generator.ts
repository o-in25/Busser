import { generateImage } from '../ai';

export type ImageGeneratorResult = {
	url: string;
	mimeType: string;
	base64: string;
};

const stylePrompts = {
	photo: {
		// Keep it simple; the 'enhancePrompt' flag will expand this into
		// a professional photography description.
		prompt: `Professional high-key product photography of a [SUBJECT]. 
             Isolated on a pure #FFFFFF white background. 
             Minimal soft contact shadows only.`,
		negativePrompt:
			'table, bar, wood, marble, surface, background texture, room, kitchen, messy shadows',
	},
};

export class ImageGenerator {
	// Pass your goal.png's base64 string here
	async generateContent(subject: string): Promise<ImageGeneratorResult> {
		//generateContent(subject: string, goalImageBase64?: string)
		const config = stylePrompts.photo;
		const fullPrompt = `Subject: ${subject}. ${config.prompt}`;

		const result = await generateImage(fullPrompt, {
			aspectRatio: '1:1',
			negativePrompt: config.negativePrompt,
			// referenceImageBase64: goalImageBase64, // The secret sauce for consistency
		});

		return {
			url: result.url,
			mimeType: result.mimeType,
			base64: result.bytesBase64Encoded,
		};
	}
}
