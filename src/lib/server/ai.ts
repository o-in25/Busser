import OpenAI from 'openai';
import type {
	ChatCompletionMessageParam,
	ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { ZodSchema } from 'zod';

import { env } from '$env/dynamic/private';

const { OPENAI_API_KEY } = env;

// clients (initialized lazily on first use)
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
	if (!openai) {
		openai = new OpenAI({ apiKey: OPENAI_API_KEY });
	}
	return openai;
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

// maps supported aspect ratios to gpt-image-1 sizes
const sizeByRatio: Record<
	NonNullable<ImageOptions['aspectRatio']>,
	'1024x1024' | '1536x1024' | '1024x1536'
> = {
	'1:1': '1024x1024',
	'16:9': '1536x1024',
	'4:3': '1536x1024',
	'9:16': '1024x1536',
	'3:4': '1024x1536',
};

// image generation using openai gpt-image-1
export async function generateImage(
	prompt: string,
	options: ImageOptions = {}
): Promise<ImageResult> {
	const { aspectRatio = '1:1', numberOfImages = 1, negativePrompt } = options;

	// gpt-image-1 has no negative prompt field, so fold it into the prompt
	const fullPrompt = negativePrompt ? `${prompt}\n\nAvoid: ${negativePrompt}` : prompt;

	const client = getOpenAI();
	const response = await client.images.generate({
		model: 'gpt-image-1',
		prompt: fullPrompt,
		n: numberOfImages,
		size: sizeByRatio[aspectRatio],
	});

	const image = response.data?.[0];
	if (!image?.b64_json) {
		throw new Error('No image generated from OpenAI');
	}

	// gpt-image-1 returns png base64
	const mimeType = 'image/png';
	return {
		url: `data:${mimeType};base64,${image.b64_json}`,
		mimeType,
		bytesBase64Encoded: image.b64_json,
	};
}
