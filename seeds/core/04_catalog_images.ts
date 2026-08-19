/**
 * Seed catalog recipe images: fetch from thecocktaildb, upload to gcs, set RecipeImageUrl.
 * Idempotent — skips recipes not in the db or that already have an image.
 */
import type { Knex } from 'knex';
import knex from 'knex';
import crypto from 'crypto';
import { Storage } from '@google-cloud/storage';
import config from '../../knexfile';
import recipes from './data/global-catalog-recipes.json';

const WORKSPACE = process.env.GLOBAL_WORKSPACE || 'ws-global-catalog';
const API = 'https://www.thecocktaildb.com/api/json/v1/1/search.php';

// some recipe names differ between us and cocktaildb
const NAME_MAP: Record<string, string> = {
	'Piña Colada': 'Pina Colada',
	'Hemingway Daiquiri': 'Hemingway Special',
	'Corpse Reviver No. 2': 'Corpse Reviver',
};

// lowercase, strip accents etc
function normalize(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z]/g, '');
}

// search by exact name, then fall back to browsing by first letter
async function fetchImage(name: string): Promise<{ buffer: Buffer; matchedAs: string } | null> {
	const searchName = NAME_MAP[name] || name;

	// 1) exact name search
	const exactRes = await fetch(`${API}?s=${encodeURIComponent(searchName)}`);
	const exactData = await exactRes.json();
	if (exactData.drinks?.[0]?.strDrinkThumb) {
		const imageRes = await fetch(exactData.drinks[0].strDrinkThumb);
		return {
			buffer: Buffer.from(await imageRes.arrayBuffer()),
			matchedAs: exactData.drinks[0].strDrink,
		};
	}

	// 2) fallback: browse by first letter and fuzzy match
	const letter = searchName[0].toLowerCase();
	const browseRes = await fetch(`${API}?f=${letter}`);
	const browseData = await browseRes.json();
	if (!browseData.drinks) return null;

	const target = normalize(searchName);
	const match = browseData.drinks.find((d: any) => normalize(d.strDrink) === target);
	if (!match?.strDrinkThumb) return null;

	const imageRes = await fetch(match.strDrinkThumb);
	return { buffer: Buffer.from(await imageRes.arrayBuffer()), matchedAs: match.strDrink };
}

export async function seed(coreDb: Knex): Promise<void> {
	// upload table lives in user_d, and images go to gcs — set both up here
	const userDb = knex(config.user);
	const decode = (s: string) => (s ? Buffer.from(s, 'base64').toString() : '{}');
	const creds = JSON.parse(decode(process.env.GOOGLE_SERVICE_KEY || ''));
	const storage = new Storage({
		credentials: { client_email: creds.client_email, private_key: creds.private_key },
	});
	const bucket = storage.bucket(process.env.BUCKET || '');

	let done = 0;
	const missed: string[] = [];

	try {
		for (const recipe of recipes) {
			const row = await coreDb('recipe')
				.select('RecipeId', 'RecipeImageUrl')
				.where({ RecipeName: recipe.name, WorkspaceId: WORKSPACE })
				.first();

			if (!row) {
				console.log(`  skip: ${recipe.name} (not in db)`);
				continue;
			}
			if (row.RecipeImageUrl) {
				console.log(`  skip: ${recipe.name} (already has image)`);
				continue;
			}

			const result = await fetchImage(recipe.name);
			if (!result) {
				console.log(`  miss: ${recipe.name} (not on thecocktaildb)`);
				missed.push(recipe.name);
				continue;
			}

			// upload to gcs, record the upload row, then point the recipe at it
			const safeName = recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
			const file = bucket.file(`catalog/${safeName}-${Date.now()}.jpg`);
			await file.save(result.buffer, { contentType: 'image/jpeg' });

			const [metadata] = await file.getMetadata();
			const publicUrl = file.publicUrl();

			await userDb('upload').insert({
				uploadId: crypto.randomUUID(),
				externalUploadId: metadata.id,
				name: metadata.name,
				bucket: metadata.bucket,
				contentType: metadata.contentType,
				size: parseInt(metadata.size?.toString() || '0'),
				publicUrl,
			});

			await coreDb('recipe').where('RecipeId', row.RecipeId).update({ RecipeImageUrl: publicUrl });

			const via = result.matchedAs !== recipe.name ? ` (matched as "${result.matchedAs}")` : '';
			console.log(`  added image: ${recipe.name}${via}`);
			done++;
		}

		console.log(`  ${done} images added`);
		if (missed.length) {
			console.log(`  ${missed.length} not found on thecocktaildb: ${missed.join(', ')}`);
		}
	} finally {
		await userDb.destroy();
	}
}
