import { DbProvider } from '../db';
import { generate } from './generator-factory';
import type { GeneratorMap, GeneratorType } from '$lib/types/generators';

const db = new DbProvider(process.env.CORE_TABLE || '');

export async function getCachedContent(
	type: string,
	referenceId: number
): Promise<{ content: any; generatedAt: Date; modelVersion: string } | null> {
	const row = await db
		.table('generatedcontent')
		.where({ ContentType: type, ReferenceId: referenceId })
		.first();
	if (!row) return null;
	const parsed = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
	return { content: parsed, generatedAt: row.generatedAt, modelVersion: row.modelVersion };
}

export async function saveCachedContent(
	type: string,
	referenceId: number,
	content: any,
	modelVersion: string = 'gpt-4o-mini'
): Promise<void> {
	await db
		.table('generatedcontent')
		.insert({
			ContentType: type,
			ReferenceId: referenceId,
			Content: JSON.stringify(content),
			ModelVersion: modelVersion,
		})
		.onConflict(['ContentType', 'ReferenceId'])
		.merge();
}

export async function deleteCachedContent(type: string, referenceId: number): Promise<void> {
	await db.table('generatedcontent').where({ ContentType: type, ReferenceId: referenceId }).del();
}

export async function generateCached<T extends GeneratorType>(
	type: T,
	input: GeneratorMap[T]['input'],
	cacheKey: number,
	options?: { regenerate?: boolean }
): Promise<GeneratorMap[T]['output'] & { cached: boolean }> {
	if (!options?.regenerate) {
		const cached = await getCachedContent(type, cacheKey);
		if (cached) {
			return { ...cached.content, cached: true };
		}
	}

	const result = await generate(type, input);

	// fire-and-forget save
	saveCachedContent(type, cacheKey, result).catch((err) =>
		console.error('failed to cache generated content:', err)
	);

	return { ...result, cached: false };
}
