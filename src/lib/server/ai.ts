import { PredictionServiceClient, helpers } from '@google-cloud/aiplatform';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { ZodSchema } from 'zod';

const { OPENAI_API_KEY, GOOGLE_SERVICE_KEY } = process.env;

// decode google credentials
const base64Decode = (str: string) => (str ? Buffer.from(str, 'base64').toString() : '{}');
const googleCredentials = JSON.parse(base64Decode(GOOGLE_SERVICE_KEY || ''));
const LOCATION = 'us-central1';

// clients (initialized lazily on first use)
let openai: OpenAI | null = null;
let vertexClient: PredictionServiceClient | null = null;

function getOpenAI(): OpenAI {
	if (!openai) {
		openai = new OpenAI({ apiKey: OPENAI_API_KEY });
	}
	return openai;
}

function getVertexClient(): PredictionServiceClient {
	if (!vertexClient) {
		vertexClient = new PredictionServiceClient({
			credentials: googleCredentials,
			apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
		});
	}
	return vertexClient;
}

// image generation options
export type ImageOptions = {
	aspectRatio?: '1:1' | '9:16' | '16:9' | '3:4' | '4:3';
	numberOfImages?: number;
	negativePrompt?: string;
	referenceImageBase64?: string;
};

export type ImageResult = {
	url: string;
	mimeType: string;
	bytesBase64Encoded: string;
};

// text generation using openai gpt-4o-mini with structured output
export async function generateText<T>(prompt: string, schema: ZodSchema<T>): Promise<T> {
	const client = getOpenAI();
	const completion = await client.beta.chat.completions.parse({
		model: 'gpt-4o-mini',
		messages: [{ role: 'user', content: prompt }],
		response_format: zodResponseFormat(schema, 'text'),
	});
	return completion.choices[0].message.parsed as T;
}

// image generation using google imagen 3
export async function generateImage(
	prompt: string,
	options: ImageOptions = {}
): Promise<ImageResult> {
	// const { aspectRatio = '1:1', numberOfImages = 1, negativePrompt, referenceImageBase64 } = options;
	const { aspectRatio = '1:1', numberOfImages = 1, negativePrompt } = options;

	// 002 is significantly better at isolated products
	const endpoint = `projects/${googleCredentials.project_id}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-002`;

	const instances: any[] = [{ prompt }];

	//  we have a goal.png, we add it as a style reference
	// if (referenceImageBase64) {
	// 	instances[0].referenceImages = [
	// 		{
	// 			referenceId: 1,
	// 			referenceType: 'REFERENCE_TYPE_STYLE',
	// 			image: { bytesBase64Encoded: referenceImageBase64 },
	// 		},
	// 	];
	// 	// update prompt to refer to the style [1]
	// 	instances[0].prompt = `${prompt} [1]`;
	// }

	const parameters = helpers.toValue({
		sampleCount: numberOfImages,
		aspectRatio,
		negativePrompt: negativePrompt || undefined,
		// the magic toggle, or so i've heard
		enhancePrompt: true,
		safetySetting: 'block_only_high',
	});

	const client = getVertexClient();
	const [response] = await client.predict({
		endpoint,
		instances: instances.map((inst) => helpers.toValue(inst)!),
		parameters,
	});

	const { predictions } = response;
	if (!predictions || predictions.length === 0) {
		throw new Error('No image generated from Imagen');
	}

	const prediction = predictions[0];
	const structValue = prediction?.structValue;
	if (!structValue?.fields) {
		throw new Error('Invalid response structure from Imagen');
	}

	const bytesBase64Encoded = structValue.fields['bytesBase64Encoded']?.stringValue || '';
	const mimeType = structValue.fields['mimeType']?.stringValue || 'image/png';

	return {
		url: `data:${mimeType};base64,${bytesBase64Encoded}`,
		mimeType,
		bytesBase64Encoded,
	};
}
