// saves cocktaildb ingredient images flattened onto white, by name substring or --inventory,
// and (--seed) uploads them as global-catalog product photos

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import knex from 'knex';
import moment from 'moment';
import { Storage } from '@google-cloud/storage';
import config from '../knexfile';

// pro keys use the v2 endpoint; dev key '1' stays on v1
const KEY = process.env.COCKTAILDB_API_KEY || '1';
const API = `https://www.thecocktaildb.com/api/json/${KEY === '1' ? 'v1' : 'v2'}/${KEY}`;
const WORKSPACE = process.env.GLOBAL_WORKSPACE || 'ws-global-catalog';
const OUT = path.join(process.cwd(), 'cocktaildb-images');

// ingredient thumbnails follow a fixed url convention, they aren't in the json
const imageUrl = (name: string) =>
	`https://www.thecocktaildb.com/images/ingredients/${encodeURIComponent(name)}.png`;

// lowercase, strip accents/punctuation, collapse to single-spaced words
const normalize = (s: string): string =>
	s
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

async function ingredientNames(): Promise<string[]> {
	const res = await fetch(`${API}/list.php?i=list`);
	const data = await res.json();
	return ((data.drinks || []) as { strIngredient1?: string }[])
		.map((i) => i.strIngredient1)
		.filter((n): n is string => !!n);
}

// download one ingredient image, flatten onto white, save as <filename>.png
async function saveImage(ingredient: string, filename: string): Promise<string | null> {
	const img = await fetch(imageUrl(ingredient));
	if (!img.ok) return null;
	const buf = Buffer.from(await img.arrayBuffer());
	const dest = path.join(OUT, `${filename}.png`);
	await sharp(buf).flatten({ background: '#ffffff' }).png().toFile(dest);
	return dest;
}

// exact ingredient match, else the longest ingredient phrase found as whole words
function matchIngredient(product: string, ingredients: string[]): string | null {
	const p = normalize(product);
	const exact = ingredients.find((i) => normalize(i) === p);
	if (exact) return exact;

	const padded = ` ${p} `;
	return (
		ingredients
			.filter((i) => padded.includes(` ${normalize(i)} `))
			.sort((a, b) => normalize(b).length - normalize(a).length)[0] || null
	);
}

async function runSearch(query: string) {
	const ingredients = await ingredientNames();
	const q = query.toLowerCase();
	const matches = ingredients.filter((n) => n.toLowerCase().includes(q));

	if (!matches.length) {
		console.log(`no ingredients matching "${query}"`);
		return;
	}

	fs.mkdirSync(OUT, { recursive: true });
	console.log(`${matches.length} match${matches.length === 1 ? '' : 'es'} for "${query}":\n`);
	for (const name of matches) {
		const dest = await saveImage(name, name);
		console.log(dest ? `${name}\n  ${dest}` : `${name}\n  ! skipped (no image)`);
	}
}

async function runInventory() {
	const ingredients = await ingredientNames();

	const db = knex(config.core);
	let products: string[];
	try {
		const rows = await db('product').select('ProductName').where('WorkspaceId', WORKSPACE);
		products = rows.map((r) => r.ProductName).sort();
	} finally {
		await db.destroy();
	}

	fs.mkdirSync(OUT, { recursive: true });
	console.log(`${products.length} products in the global catalog:\n`);

	const missed: string[] = [];
	let saved = 0;
	for (const name of products) {
		const ingredient = matchIngredient(name, ingredients);
		const dest = ingredient ? await saveImage(ingredient, name) : null;
		if (!dest) {
			missed.push(name);
			continue;
		}
		saved++;
		console.log(`${name}  →  ${ingredient}\n  ${dest}`);
	}

	console.log(`\n${saved} images saved, ${missed.length} unmatched`);
	if (missed.length) console.log(`\nno cocktaildb image for:\n  ${missed.join('\n  ')}`);
}

// compress to webp + upload to the bucket, mirroring storage.ts getSignedUrl
async function uploadPhoto(
	bucket: ReturnType<Storage['bucket']>,
	user: knex.Knex,
	png: Buffer,
	productName: string
): Promise<string> {
	const webp = await sharp(png)
		.resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 82 })
		.toBuffer();

	const safe = productName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/\.[^.]+$/, '');
	const name = `ingredients/${WORKSPACE}/${safe}-${moment().format('MMDDYYYYSS')}.webp`;
	const object = bucket.file(name);
	await object.save(webp, {
		contentType: 'image/webp',
		metadata: { cacheControl: 'public, max-age=31536000, immutable' },
	});

	const publicUrl = object.publicUrl();
	const [meta] = await object.getMetadata();
	await user('upload').insert({
		uploadId: crypto.randomUUID(),
		externalUploadId: meta.id,
		name: meta.name,
		bucket: meta.bucket,
		contentType: meta.contentType,
		size: parseInt(meta.size?.toString() || '0'),
		publicUrl,
	});
	return publicUrl;
}

async function runSeed(opts: { commit: boolean; overwrite: boolean }) {
	const { BUCKET } = process.env;
	if (!BUCKET) throw new Error('BUCKET is not set');
	const creds = JSON.parse(
		Buffer.from(process.env.GOOGLE_SERVICE_KEY || '', 'base64').toString() || '{}'
	);
	const storage = new Storage({
		credentials: { client_email: creds.client_email, private_key: creds.private_key },
	});
	const bucket = storage.bucket(BUCKET);

	const core = knex(config.core);
	const user = knex(config.user);
	try {
		// non-homemade global products (homemade already has its own art)
		const products = await core('product as p')
			.leftJoin('supplier as s', 'p.SupplierId', 's.SupplierId')
			.leftJoin('suppliertype as st', 's.SupplierTypeId', 'st.SupplierTypeId')
			.leftJoin('productdetail as pd', 'p.ProductId', 'pd.ProductId')
			.where('p.WorkspaceId', WORKSPACE)
			.andWhere((b) =>
				b.whereNull('st.SupplierTypeName').orWhereNot('st.SupplierTypeName', 'homemade')
			)
			.select('p.ProductId', 'p.ProductName', 'pd.ProductImageUrl')
			.orderBy('p.ProductName');

		console.log(
			`${opts.commit ? 'COMMIT' : 'DRY RUN'}: ${products.length} non-homemade products\n`
		);

		// gather candidates, then drop repeated art — branded bottles that fell back to
		// the same generic image have byte-identical pngs, so we skip any hash used twice
		type Candidate = { id: number; name: string; png: Buffer; hash: string };
		const candidates: Candidate[] = [];
		let skippedExisting = 0;
		let noImage = 0;
		for (const p of products) {
			const file = path.join(OUT, `${p.ProductName}.png`);
			if (!fs.existsSync(file)) {
				noImage++;
				continue;
			}
			if (p.ProductImageUrl && !opts.overwrite) {
				skippedExisting++;
				continue;
			}
			const png = fs.readFileSync(file);
			const hash = crypto.createHash('sha1').update(png).digest('hex');
			candidates.push({ id: p.ProductId, name: p.ProductName, png, hash });
		}

		const count = new Map<string, number>();
		for (const c of candidates) count.set(c.hash, (count.get(c.hash) || 0) + 1);
		const unique = candidates.filter((c) => count.get(c.hash) === 1);
		const repeated = candidates.filter((c) => (count.get(c.hash) || 0) > 1);

		let seeded = 0;
		for (const c of unique) {
			if (!opts.commit) {
				console.log(`  + ${c.name}`);
				seeded++;
				continue;
			}
			const publicUrl = await uploadPhoto(bucket, user, c.png, c.name);
			const existing = await core('productdetail').where('ProductId', c.id).first();
			if (existing) {
				await core('productdetail').where('ProductId', c.id).update({ ProductImageUrl: publicUrl });
			} else {
				await core('productdetail').insert({ ProductId: c.id, ProductImageUrl: publicUrl });
			}
			seeded++;
			console.log(`  + ${c.name}\n    ${publicUrl}`);
		}

		if (repeated.length) {
			console.log(`\nskipped ${repeated.length} with repeated generic art:`);
			for (const c of repeated) console.log(`  - ${c.name}`);
		}

		console.log(
			`\n${opts.commit ? 'seeded' : 'would seed'} ${seeded}, ${repeated.length} generic/repeated, ${skippedExisting} already had an image, ${noImage} without a downloaded image`
		);
		if (!opts.commit) console.log('\nre-run with --commit to upload + write ProductImageUrl');
	} finally {
		await core.destroy();
		await user.destroy();
	}
}

async function main() {
	const args = process.argv.slice(2);
	if (args.includes('--seed'))
		return runSeed({ commit: args.includes('--commit'), overwrite: args.includes('--overwrite') });
	if (args.includes('--inventory')) return runInventory();

	const query = args.join(' ').trim();
	if (!query) {
		console.error(
			'usage: pnpm cocktaildb:check "<search string>" | --inventory | --seed [--commit] [--overwrite]'
		);
		process.exit(1);
	}
	return runSearch(query);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
