import { PredictionServiceClient, helpers } from '@google-cloud/aiplatform';
import OpenAI from 'openai';
import type {
	ChatCompletionMessageParam,
	ChatCompletionTool,
} from 'openai/resources/chat/completions';
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

// text generation from image using openai gpt-4o-mini with structured output
export async function generateTextFromImage<T>(
	prompt: string,
	imageDataUri: string,
	schema: ZodSchema<T>
): Promise<T> {
	const client = getOpenAI();
	const completion = await client.beta.chat.completions.parse({
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: [
					{ type: 'text', text: prompt },
					{ type: 'image_url', image_url: { url: imageDataUri } },
				],
			},
		],
		response_format: zodResponseFormat(schema, 'text'),
	});
	return completion.choices[0].message.parsed as T;
}

// streaming chat with tool calling for ai assistant
// onToolCall: executes tool and returns result string for OpenAI
// onEmit: optional callback to push custom SSE events to the stream (e.g. proposals)
export async function runAssistantChat(
	messages: ChatCompletionMessageParam[],
	tools: ChatCompletionTool[],
	onToolCall: (name: string, args: any) => Promise<string>,
	onEmit?: (emit: (event: Record<string, any>) => void, toolName: string, args: any) => void
): Promise<ReadableStream> {
	const client = getOpenAI();

	const encoder = new TextEncoder();

	return new ReadableStream({
		async start(controller) {
			const emit = (event: Record<string, any>) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
			};

			try {
				// loop to handle multiple rounds of tool calls
				let currentMessages = [...messages];
				let maxRounds = 10;

				while (maxRounds-- > 0) {
					const stream = await client.chat.completions.create({
						model: 'gpt-4o-mini',
						messages: currentMessages,
						tools,
						stream: true,
					});

					let assistantContent = '';
					let toolCalls: Array<{
						id: string;
						function: { name: string; arguments: string };
					}> = [];

					for await (const chunk of stream) {
						const choice = chunk.choices[0];
						if (!choice) continue;

						const { delta } = choice;

						// stream text content
						if (delta.content) {
							assistantContent += delta.content;
							emit({ type: 'text', content: delta.content });
						}

						// accumulate tool calls
						if (delta.tool_calls) {
							for (const tc of delta.tool_calls) {
								if (tc.index !== undefined) {
									while (toolCalls.length <= tc.index) {
										toolCalls.push({ id: '', function: { name: '', arguments: '' } });
									}
									if (tc.id) toolCalls[tc.index].id = tc.id;
									if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name;
									if (tc.function?.arguments)
										toolCalls[tc.index].function.arguments += tc.function.arguments;
								}
							}
						}

						if (choice.finish_reason === 'stop') {
							emit({ type: 'done' });
							controller.close();
							return;
						}
					}

					// if we have tool calls, execute them and continue the loop
					if (toolCalls.length > 0) {
						currentMessages.push({
							role: 'assistant',
							content: assistantContent || null,
							tool_calls: toolCalls.map((tc) => ({
								id: tc.id,
								type: 'function' as const,
								function: tc.function,
							})),
						});

						for (const tc of toolCalls) {
							let args: any;
							try {
								args = JSON.parse(tc.function.arguments);
							} catch {
								args = {};
							}

							emit({ type: 'tool_call', name: tc.function.name });

							// allow caller to emit custom events (e.g. proposal data)
							if (onEmit) {
								onEmit(emit, tc.function.name, args);
							}

							const result = await onToolCall(tc.function.name, args);
							currentMessages.push({
								role: 'tool',
								tool_call_id: tc.id,
								content: result,
							});
						}

						// continue loop for the next round
						toolCalls = [];
						assistantContent = '';
					} else {
						emit({ type: 'done' });
						controller.close();
						return;
					}
				}

				// max rounds exceeded
				emit({ type: 'done' });
				controller.close();
			} catch (error: any) {
				emit({ type: 'error', content: error.message || 'An error occurred' });
				controller.close();
			}
		},
	});
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
		enhancePrompt: false,
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
