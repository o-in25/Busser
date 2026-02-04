import { generateImage } from '../ai';

export type ImageGeneratorResult = {
	url: string;
	mimeType: string;
	base64: string;
};

const stylePrompts = {
	photo: {
		prompt: `Studio product photograph of a [SUBJECT] cocktail served in its traditional correct glassware with appropriate classic garnish and ice.
Single drink centered in frame. Shot from a 30-degree elevated angle.
High-key lighting: large soft diffused key light from above-front, fill light eliminating harsh shadows, edge light separating the glass from the background.
Seamless pure white background, no surface texture visible. Only a subtle soft contact shadow directly beneath the glass.
Crystal-clear focus on the drink. Visible condensation droplets on the glass. Liquid is realistic and transparent where appropriate.
Professional commercial beverage photography, 80mm lens, shallow depth of field, color-accurate.`,
		negativePrompt:
			'text, words, letters, labels, logos, watermarks, people, hands, bar, countertop, table, wood, marble, granite, patterned surface, colored background, gradient background, room, kitchen, restaurant, multiple drinks, bottles, napkin, coaster, blurry, illustration, cartoon, painting, 3d render, artificial looking',
	},
};

export type ImageContext = {
	ingredients?: string[];
	technique?: string;
};

export class ImageGenerator {
	async generateContent(subject: string, context?: ImageContext): Promise<ImageGeneratorResult> {
		const config = stylePrompts.photo;
		let fullPrompt = config.prompt.replace('[SUBJECT]', subject);

		if (context?.ingredients?.length) {
			fullPrompt += `\nThe drink is made with: ${context.ingredients.join(', ')}.`;
		}
		if (context?.technique) {
			fullPrompt += ` Prepared ${context.technique.toLowerCase()}.`;
		}

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
