import 'dotenv/config';
import crypto from 'crypto';
import knex from 'knex';
import { Storage } from '@google-cloud/storage';
import config from '../knexfile';
import recipes from '../seeds/core/data/global-catalog-recipes.json';

const WORKSPACE = 'ws-global-catalog';
const API = 'https://www.thecocktaildb.com/api/json/v1/1/search.php';

// some recipe names differ between us and cocktaildb
const NAME_MAP: Record<string, string> = {
	'Piña Colada': 'Pina Colada',
	'Hemingway Daiquiri': 'Hemingway Special',
	'Corpse Reviver No. 2': 'Corpse Reviver',
};

// gcs setup
const base64Decode = (str: string) => (str ? Buffer.from(str, 'base64').toString() : '{}');
const creds = JSON.parse(base64Decode(process.env.GOOGLE_SERVICE_KEY || ''));
const storage = new Storage({
	credentials: { client_email: creds.client_email, private_key: creds.private_key },
});
const bucket = storage.bucket(process.env.BUCKET || '');

// db connections
const appDb = knex(config.core);
const userDb = knex(config.user);

// lowercase, strip accents etc
function normalize(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z]/g, '');
}

// search by exact name, then fall back
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

async function uploadToGcs(buffer: Buffer, recipeName: string): Promise<string> {
	const safeName = recipeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
	const fileName = `catalog/${safeName}-${Date.now()}.jpg`;
	const file = bucket.file(fileName);

	await file.save(buffer, { contentType: 'image/jpeg' });

	const publicUrl = file.publicUrl();
	const [metadata] = await file.getMetadata();

	await userDb('upload').insert({
		uploadId: crypto.randomUUID(),
		externalUploadId: metadata.id,
		name: metadata.name,
		bucket: metadata.bucket,
		contentType: metadata.contentType,
		size: parseInt(metadata.size?.toString() || '0'),
		publicUrl,
	});

	return publicUrl;
}

async function main() {
	const limit = parseInt(process.argv[2] || '0') || recipes.length;
	let done = 0;
	let skipped = 0;
	const missed: string[] = [];

	console.log(`seeding images (limit: ${limit})\n`);

	for (const recipe of recipes) {
		if (done >= limit) break;

		const row = (await appDb('recipe')
			.select('RecipeId', 'RecipeImageUrl')
			.where({ RecipeName: recipe.name, WorkspaceId: WORKSPACE })
			.first()) as any;

		if (!row) {
			console.log(`  skip: ${recipe.name} (not in db)`);
			skipped++;
			continue;
		}

		if (row.RecipeImageUrl) {
			console.log(`  skip: ${recipe.name} (already has image)`);
			skipped++;
			continue;
		}

		const result = await fetchImage(recipe.name);
		if (!result) {
			console.log(`  miss: ${recipe.name} (not on thecocktaildb)`);
			missed.push(recipe.name);
			continue;
		}

		const publicUrl = await uploadToGcs(result.buffer, recipe.name);
		await appDb('recipe').where('RecipeId', row.RecipeId).update({ RecipeImageUrl: publicUrl });

		const via = result.matchedAs !== recipe.name ? ` (matched as "${result.matchedAs}")` : '';
		console.log(`  done: ${recipe.name}${via}`);
		done++;
	}

	console.log(`\n${done} images added, ${skipped} skipped`);
	if (missed.length) {
		console.log(`${missed.length} not found on thecocktaildb:`);
		missed.forEach((n) => console.log(`  - ${n}`));
	}
}

main()
	.catch(console.error)
	.finally(async () => {
		await appDb.destroy();
		await userDb.destroy();
	});
