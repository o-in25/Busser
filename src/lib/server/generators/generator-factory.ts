import { generateImage, generateText } from '../ai';
import { z } from 'zod';
import prompts from './prompts.json';
import type {
	ImageResult,
	InventoryDescriptionInput,
	InventoryDescriptionOutput,
	InventoryImageInput,
	CatalogDescriptionInput,
	CatalogDescriptionOutput,
	CatalogImageInput,
	RecipeInsightsInput,
	RecipeInsightsOutput,
	RecipeRatingsInput,
	RecipeRatingsOutput,
	CategoryDescriptionInput,
	CategoryDescriptionOutput,
	GeneratorMap,
	GeneratorType,
} from '$lib/types/generators';

// generator configs define the prompt, schema, and how to build the final prompt
type TextGeneratorConfig<TInput, TOutput> = {
	type: 'text';
	schema: z.ZodType<TOutput>;
	buildPrompt: (input: TInput) => string;
};

type ImageGeneratorConfig<TInput> = {
	type: 'image';
	prompt: string;
	negativePrompt: string;
	buildPrompt: (base: string, input: TInput) => string;
};

// zod schemas for validation
const inventoryDescriptionSchema: z.ZodType<InventoryDescriptionOutput> = z.object({
	description: z.string(),
});

const catalogDescriptionSchema: z.ZodType<CatalogDescriptionOutput> = z.object({
	history: z.string(),
	flavorProfile: z.array(z.string()),
	goodWith: z.array(z.string()),
	avoidWith: z.array(z.string()),
});

const recipeInsightsSchema: z.ZodType<RecipeInsightsOutput> = z.object({
	history: z.string().describe('Brief history and origin of the cocktail (2-3 sentences)'),
	flavorProfile: z
		.string()
		.describe('Description of taste: sweetness, bitterness, texture, finish (2-3 sentences)'),
	whyItWorks: z
		.string()
		.describe('The balance/science behind why this combination works (1-2 sentences)'),
	proTips: z.array(z.string()).describe('3 bartender tips for making this drink well'),
	substitutions: z
		.array(
			z.object({
				ingredient: z.string(),
				substitute: z.string(),
				note: z.string(),
			})
		)
		.describe('2-3 ingredient substitutions with brief notes on how it changes the drink'),
	glassware: z.string().describe('Recommended glass type and why'),
	garnish: z.array(z.string()).describe('2-3 garnish options'),
	foodPairings: z.array(z.string()).describe('3-4 food pairing suggestions'),
	occasion: z.string().describe('Best occasions/mood for this drink (1 sentence)'),
	variations: z
		.array(
			z.object({
				name: z.string(),
				description: z.string(),
			})
		)
		.describe('2-3 variations or related cocktails to try'),
	similarCocktails: z.array(z.string()).describe('3 similar cocktails if you like this one'),
});

const recipeRatingsSchema: z.ZodType<RecipeRatingsOutput> = z.object({
	sweetnessRating: z.number().min(1).max(10),
	drynessRating: z.number().min(1).max(10),
	versatilityRating: z.number().min(1).max(10),
	strengthRating: z.number().min(1).max(10),
});

const categoryDescriptionSchema: z.ZodType<CategoryDescriptionOutput> = z.object({
	description: z.string(),
});

// generator configurations
const generators: {
	[T in GeneratorType]: GeneratorMap[T]['output'] extends ImageResult
		? ImageGeneratorConfig<GeneratorMap[T]['input']>
		: TextGeneratorConfig<GeneratorMap[T]['input'], GeneratorMap[T]['output']>;
} = {
	'inventory-description': {
		type: 'text',
		schema: inventoryDescriptionSchema,
		buildPrompt: (input: InventoryDescriptionInput) =>
			prompts.inventoryDescription.replace('[NAME]', input.name),
	},

	'inventory-image': {
		type: 'image',
		prompt: prompts.inventoryImage.prompt,
		negativePrompt: prompts.inventoryImage.negativePrompt,
		buildPrompt: (base: string, input: InventoryImageInput) => {
			let prompt = base.replace('[SUBJECT]', input.subject);
			if (input.description) {
				prompt += `\nProduct details: ${input.description}`;
			}
			return prompt;
		},
	},

	'catalog-description': {
		type: 'text',
		schema: catalogDescriptionSchema,
		buildPrompt: (input: CatalogDescriptionInput) =>
			prompts.catalogDescription.replaceAll('[NAME]', input.name),
	},

	'catalog-image': {
		type: 'image',
		prompt: prompts.catalogImage.prompt,
		negativePrompt: prompts.catalogImage.negativePrompt,
		buildPrompt: (base: string, input: CatalogImageInput) => {
			let prompt = base.replace('[SUBJECT]', input.subject);
			if (input.ingredients?.length) {
				prompt += `\nThe drink is made with: ${input.ingredients.join(', ')}.`;
			}
			if (input.technique) {
				prompt += ` Prepared ${input.technique.toLowerCase()}.`;
			}
			return prompt;
		},
	},

	'recipe-insights': {
		type: 'text',
		schema: recipeInsightsSchema,
		buildPrompt: (input: RecipeInsightsInput) =>
			prompts.recipeInsights.replace('[NAME]', input.cocktailName),
	},

	'recipe-ratings': {
		type: 'text',
		schema: recipeRatingsSchema,
		buildPrompt: (input: RecipeRatingsInput) => {
			const ingredientsList = input.ingredients
				.map((i) => `- ${i.quantity} ${i.unit} ${i.name}${i.proof ? ` (${i.proof} proof)` : ''}`)
				.join('\n');

			return prompts.recipeRatings
				.replace('[NAME]', input.recipeName)
				.replace(
					'[DESCRIPTION]',
					input.recipeDescription ? `DESCRIPTION: ${input.recipeDescription}` : ''
				)
				.replace('[COUNT]', String(input.ingredients.length))
				.replace('[INGREDIENTS]', ingredientsList);
		},
	},

	'category-description': {
		type: 'text',
		schema: categoryDescriptionSchema,
		buildPrompt: (input: CategoryDescriptionInput) =>
			prompts.categoryDescription.replace('[NAME]', input.name),
	},
};

// the factory function
export async function generate<T extends GeneratorType>(
	type: T,
	input: GeneratorMap[T]['input']
): Promise<GeneratorMap[T]['output']> {
	const config = generators[type];

	if (config.type === 'text') {
		const textConfig = config as TextGeneratorConfig<
			GeneratorMap[T]['input'],
			GeneratorMap[T]['output']
		>;
		const prompt = textConfig.buildPrompt(input);
		return generateText(prompt, textConfig.schema);
	} else {
		const imageConfig = config as ImageGeneratorConfig<GeneratorMap[T]['input']>;
		const imageInput = input as { customPrompt?: string };

		// if custom prompt provided, wrap with standard photography style
		// user only describes the subject, we add the professional photography context
		let prompt: string;
		if (imageInput.customPrompt) {
			prompt = prompts.customImage.prompt.replace('[SUBJECT]', imageInput.customPrompt);
		} else {
			prompt = imageConfig.buildPrompt(imageConfig.prompt, input);
		}

		const result = await generateImage(prompt, {
			aspectRatio: '1:1',
			negativePrompt: imageConfig.negativePrompt,
		});
		return {
			url: result.url,
			mimeType: result.mimeType,
			base64: result.bytesBase64Encoded,
		} as GeneratorMap[T]['output'];
	}
}
