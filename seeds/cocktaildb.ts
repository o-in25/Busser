/*
adds recipes from https://www.thecocktaildb.com and adds them to the catalog
run with pnpm import:cocktaildb [--limit=N] [--dry]
*/

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import knex from 'knex';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { z } from 'zod';
import config from '../knexfile';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WORKSPACE = process.env.GLOBAL_WORKSPACE || 'ws-global-catalog';

const RECIPES_PATH = path.join(__dirname, './core/data/global-catalog-recipes.json');
const IBA_PATH = path.join(__dirname, './core/data/iba.json');
const API = 'https://www.thecocktaildb.com/api/json/v1/1';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const ALL = args.includes('--all');
const IBA_MODE = args.includes('--iba');
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

type Spirit = 'Whiskey' | 'Gin' | 'Vodka' | 'Tequila & Mezcal' | 'Rum' | 'Brandy';
const TECHNIQUES = ['Stirred', 'Shaken', 'Dry Shaken', 'Blended', 'Whip Shaken'] as const;

const CATEGORY_TO_SPIRIT: Record<string, Spirit> = {
	'London Dry Gin': 'Gin',
	'Old Tom Gin': 'Gin',
	'Plain Vodka': 'Vodka',
	'Flavored Vodka': 'Vodka',
	'Blanco Tequila': 'Tequila & Mezcal',
	'Reposado Tequila': 'Tequila & Mezcal',
	Mezcal: 'Tequila & Mezcal',
	'White Rum': 'Rum',
	'Dark Rum': 'Rum',
	Cachaça: 'Rum',
	'Bourbon Whiskey': 'Whiskey',
	'Rye Whiskey': 'Whiskey',
	'Scotch Whisky': 'Whiskey',
	Cognac: 'Brandy',
	'Apple Brandy': 'Brandy',
	Pisco: 'Brandy',
};
const SPIRIT_PRIORITY: Spirit[] = ['Whiskey', 'Gin', 'Tequila & Mezcal', 'Rum', 'Brandy', 'Vodka'];

const CATEGORY_ALIAS: Record<string, string> = {
	gin: 'London Dry Gin',
	'london dry gin': 'London Dry Gin',
	'old tom gin': 'Old Tom Gin',
	vodka: 'Plain Vodka',
	'light rum': 'White Rum',
	'white rum': 'White Rum',
	'dark rum': 'Dark Rum',
	'gold rum': 'Dark Rum',
	rum: 'White Rum',
	bourbon: 'Bourbon Whiskey',
	'blended whiskey': 'Bourbon Whiskey',
	'rye whiskey': 'Rye Whiskey',
	scotch: 'Scotch Whisky',
	'blended scotch': 'Scotch Whisky',
	'irish whiskey': 'Rye Whiskey',
	tequila: 'Blanco Tequila',
	'blanco tequila': 'Blanco Tequila',
	'reposado tequila': 'Reposado Tequila',
	mezcal: 'Mezcal',
	cognac: 'Cognac',
	brandy: 'Cognac',
	'apple brandy': 'Apple Brandy',
	pisco: 'Pisco',
	cachaca: 'Cachaça',
	'sweet vermouth': 'Sweet Vermouth',
	'dry vermouth': 'Dry Vermouth',
	'lillet blanc': 'Lillet Blanc',
	port: 'Fortified wine',
	'creme de cassis': 'Blackcurrant Liqueur',
	campari: 'Amaro',
	aperol: 'Aperol',
	amaretto: 'Amaretto',
	drambuie: 'Drambuie',
	'triple sec': 'Orange Liqueur',
	cointreau: 'Orange Liqueur',
	'orange liqueur': 'Orange Liqueur',
	curacao: 'Curaçao',
	'orange curacao': 'Curaçao',
	'blue curacao': 'Curaçao',
	'maraschino liqueur': 'Maraschino Liqueur',
	maraschino: 'Maraschino Liqueur',
	'green chartreuse': 'Green Chartreuse',
	'yellow chartreuse': 'Yellow Chartreuse',
	'creme de cacao': 'Crème de Cacao',
	'white creme de cacao': 'Crème de Cacao',
	'creme de violette': 'Crème de Violette',
	'coffee liqueur': 'Coffee Liquor',
	kahlua: 'Coffee Liquor',
	absinthe: 'Absinthe',
	'cherry heering': 'Cherry Heering',
	'lemon juice': 'Lemon Juice',
	lemon: 'Lemon Juice',
	'lime juice': 'Lime Juice',
	lime: 'Lime Juice',
	'orange juice': 'Orange Juice',
	'pineapple juice': 'Pineapple Juice',
	'grapefruit juice': 'Grapefruit Juice',
	'cranberry juice': 'Cranberry Juice',
	'simple syrup': 'Simple Syrup',
	'sugar syrup': 'Simple Syrup',
	sugar: 'Sugar',
	'powdered sugar': 'Sugar',
	'honey syrup': 'Honey Syrup',
	honey: 'Honey Syrup',
	'agave syrup': 'Agave Syrup',
	'agave nectar': 'Agave Syrup',
	grenadine: 'Grenadine',
	'raspberry syrup': 'Raspberry Syrup',
	'coconut cream': 'Coconut Cream',
	'cream of coconut': 'Coconut Cream',
	cream: 'Cream',
	'heavy cream': 'Cream',
	'light cream': 'Cream',
	'angostura bitters': 'Bitters',
	bitters: 'Bitters',
	'peach bitters': 'Bitters',
	'orange bitters': 'Orange Bitters',
	'soda water': 'Soda Water',
	'club soda': 'Soda Water',
	'carbonated water': 'Soda Water',
	'coca-cola': 'Cola',
	cola: 'Cola',
	'ginger beer': 'Ginger Beer',
	champagne: 'Champagne',
	prosecco: 'Champagne',
	'egg white': 'Eggs',
	'egg yolk': 'Eggs',
	egg: 'Eggs',
	mint: 'Mint',
};

const IGNORE = new Set([
	'ice',
	'ice cubes',
	'crushed ice',
	'water',
	'orange peel',
	'lemon peel',
	'lime peel',
	'orange',
	'lemon',
	'lime wedge',
	'lime wheel',
	'cherry',
	'maraschino cherry',
	'olive',
	'salt',
	'nutmeg',
	'cinnamon',
	'orange slice',
	'mint sprig',
	'mint garnish',
]);

const normalize = (s: string): string =>
	s
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');

function parseMeasure(
	raw: string | null
): { qty: number; unit: string; oz: number | null; top?: boolean } | null {
	if (!raw) return null;
	let s = raw.trim().toLowerCase();
	if (!s) return null;

	// dashes
	let m = s.match(/^([\d.]+)\s*dash/);
	if (m) return { qty: Math.max(1, Math.round(parseFloat(m[1]))), unit: 'dash', oz: null };
	if (/^dash/.test(s)) return { qty: 1, unit: 'dash', oz: null };

	// barspoon / tsp / tbsp
	if (/bar\s*spoon|barspoon/.test(s)) {
		m = s.match(/^([\d./\s]+)/);
		return {
			qty: m ? Math.max(1, Math.round(parseFraction(m[1]))) : 1,
			unit: 'barspoon',
			oz: null,
		};
	}
	if (/tsp|teaspoon/.test(s)) {
		m = s.match(/^([\d./\s]+)/);
		return { qty: m ? parseFraction(m[1]) : 1, unit: 'tsp', oz: null };
	}
	if (/tbsp|tablespoon/.test(s)) {
		m = s.match(/^([\d./\s]+)/);
		const tbsp = m ? parseFraction(m[1]) : 1;
		return { qty: Math.round(tbsp * 15), unit: 'ml', oz: (tbsp * 15) / 30 };
	}

	if (/^(top|fill|splash)/.test(s) || /to taste/.test(s)) {
		return { qty: 60, unit: 'ml', oz: 2, top: true };
	}

	m = s.match(/^([\d.]+)\s*ml/);
	if (m) {
		const ml = parseFloat(m[1]);
		return { qty: Math.round(ml), unit: 'ml', oz: ml / 30 };
	}
	m = s.match(/^([\d.]+)\s*cl/);
	if (m) {
		const ml = parseFloat(m[1]) * 10;
		return { qty: Math.round(ml), unit: 'ml', oz: ml / 30 };
	}

	// shots
	m = s.match(/^([\d./\s]+)\s*shot/);
	if (m) {
		const oz = parseFraction(m[1]);
		return { qty: Math.round(oz * 30), unit: 'ml', oz };
	}

	// oz
	m = s.match(/^([\d./\s]+)\s*(oz|ounce)/);
	if (m) {
		const oz = parseFraction(m[1]);
		return { qty: Math.round(oz * 30), unit: 'ml', oz };
	}

	return null;
}

function parseFraction(input: string): number {
	const parts = input.trim().split(/\s+/);
	let total = 0;
	for (const p of parts) {
		if (p.includes('/')) {
			const [a, b] = p.split('/').map(Number);
			if (b) total += a / b;
		} else {
			const n = parseFloat(p);
			if (!isNaN(n)) total += n;
		}
	}
	return total || 1;
}

function stepDesc(
	oz: number | null,
	unit: string,
	qty: number,
	ingredient: string,
	top = false
): string {
	if (unit === 'dash') return `Add ${qty} ${qty === 1 ? 'dash' : 'dashes'} ${ingredient}`;
	if (unit === 'barspoon')
		return `Add ${qty} ${qty === 1 ? 'barspoon' : 'barspoons'} ${ingredient}`;
	if (unit === 'tsp') return `Add ${qty} tsp ${ingredient}`;
	if (top) return `Top with ${ingredient}`;
	if (oz) return `Add ${round1(oz)}oz ${ingredient}`;
	return `Add ${ingredient}`;
}
const round1 = (n: number): number => Math.round(n * 10) / 10;

type Step = { category: string; qty: number; unit: string; desc: string };
type Recipe = {
	name: string;
	spirit: Spirit;
	technique: string;
	description: string;
	ratings: { sweetness: number; dryness: number; strength: number; versatility: number };
	steps: Step[];
};

const MetaSchema = z.object({
	description: z.string(),
	technique: z.enum(TECHNIQUES),
	ratings: z.object({
		sweetness: z.number().min(0).max(10),
		dryness: z.number().min(0).max(10),
		strength: z.number().min(0).max(10),
		versatility: z.number().min(0).max(10),
	}),
});
type Meta = z.infer<typeof MetaSchema>;

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
	if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
	return openai;
}

// one gpt call to fill the 4 fields cocktaildb lacks
async function fillMeta(
	name: string,
	spirit: Spirit,
	ingredients: string[],
	instructions: string
): Promise<Meta> {
	const prompt = `You are cataloging a classic cocktail for a bartending app.

Cocktail: ${name}
Base spirit: ${spirit}
Ingredients: ${ingredients.join(', ')}
Instructions: ${instructions}

Return:
- description: 1-2 sentences, factual bartending voice (like "Equal parts gin, sweet vermouth, and Campari. A bitter, complex aperitivo served over ice with an orange peel.")
- technique: one of Stirred, Shaken, Dry Shaken, Blended, Whip Shaken (infer from ingredients/instructions; citrus/egg/juice → Shaken, spirit-only → Stirred)
- ratings: sweetness, dryness, strength, versatility each 0-10`;

	const completion = await getOpenAI().beta.chat.completions.parse({
		model: 'gpt-4o-mini',
		messages: [{ role: 'user', content: prompt }],
		response_format: zodResponseFormat(MetaSchema, 'meta'),
	});
	const { parsed } = completion.choices[0].message;
	if (!parsed) throw new Error('no meta returned');
	return parsed;
}

async function fetchJson(url: string): Promise<any> {
	const res = await fetch(url);
	return res.json();
}

async function fetchIbaDrinks(): Promise<{ drinks: any[]; missing: string[] }> {
	const groups = JSON.parse(fs.readFileSync(IBA_PATH, 'utf8')) as Record<string, string[]>;
	const names = Object.values(groups).flat();
	const drinks: any[] = [];
	const missing: string[] = [];
	for (const name of names) {
		const q = normalize(name);
		const data = await fetchJson(`${API}/search.php?s=${encodeURIComponent(name)}`);
		const hits: any[] = data.drinks || [];
		const hit = hits.find((d) => normalize(d.strDrink) === q);
		if (hit) drinks.push(hit);
		else missing.push(name);
		// free key caps at 60 req / 10s
		await sleep(230);
	}
	console.log(
		`IBA list: ${names.length} names → ${drinks.length} found on cocktaildb, ${missing.length} not found`
	);
	return { drinks, missing };
}

function formatRecipe(r: Recipe): string {
	const rt = r.ratings;
	const ratings = `{ "sweetness": ${round1(rt.sweetness).toFixed(1)}, "dryness": ${round1(rt.dryness).toFixed(1)}, "strength": ${round1(rt.strength).toFixed(1)}, "versatility": ${round1(rt.versatility).toFixed(1)} }`;
	const steps = r.steps
		.map(
			(s) =>
				`\t\t\t{ "category": ${JSON.stringify(s.category)}, "qty": ${s.qty}, "unit": ${JSON.stringify(s.unit)}, "desc": ${JSON.stringify(s.desc)} }`
		)
		.join(',\n');
	return [
		'\t{',
		`\t\t"name": ${JSON.stringify(r.name)},`,
		`\t\t"spirit": ${JSON.stringify(r.spirit)},`,
		`\t\t"technique": ${JSON.stringify(r.technique)},`,
		`\t\t"description": ${JSON.stringify(r.description)},`,
		`\t\t"ratings": ${ratings},`,
		'\t\t"steps": [',
		steps,
		'\t\t]',
		'\t}',
	].join('\n');
}

async function main() {
	const rawFile = fs.readFileSync(RECIPES_PATH, 'utf8');
	const existing = JSON.parse(rawFile) as Recipe[];
	const existingNames = new Set(existing.map((r) => normalize(r.name)));

	console.log(`loaded ${existing.length} recipes from json${DRY ? ' (dry run)' : ''}`);

	// also dedup against what's actually in the db (catches app-added recipes not
	// in the json). read-only; falls back to json-only if the proxy isn't up.
	const db = knex(config.core);
	try {
		const rows = await db('recipe').select('RecipeName').where('WorkspaceId', WORKSPACE);
		for (const r of rows) existingNames.add(normalize(r.RecipeName));
		console.log(`+ ${rows.length} recipe names from app_d (dedup against live catalog)\n`);
	} catch (e: any) {
		console.log(`! could not reach app_d, deduping against json only (${e.code || e.message})\n`);
	} finally {
		await db.destroy();
	}

	// 1) discover: the official IBA name list (--iba, preferred) or the a-z browse
	let drinks: any[];
	if (IBA_MODE) {
		const res = await fetchIbaDrinks();
		drinks = res.drinks;
		if (res.missing.length) {
			console.log(
				`not on free cocktaildb (need prod key / manual authoring):\n  ${res.missing.join(', ')}\n`
			);
		}
	} else {
		const seenIds = new Set<string>();
		drinks = [];
		for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
			const data = await fetchJson(`${API}/search.php?f=${letter}`);
			for (const d of data.drinks || []) {
				if (seenIds.has(d.idDrink)) continue;
				seenIds.add(d.idDrink);
				drinks.push(d);
			}
		}
		console.log(`discovered ${drinks.length} unique drinks`);
	}

	// 2) filter to IBA
	const added: Recipe[] = [];
	const skippedUnmapped: { name: string; ing: string }[] = [];
	const skippedNoSpirit: string[] = [];
	let skippedExisting = 0;
	let skippedNonIba = 0;

	for (const detail of drinks) {
		if (added.length >= LIMIT) break;

		const name: string = detail.strDrink;
		if (existingNames.has(normalize(name))) {
			skippedExisting++;
			continue;
		}
		if (!ALL && !IBA_MODE && !detail.strIBA) {
			skippedNonIba++;
			continue;
		}

		// gather ingredient/measure pairs
		const rawPairs: { ing: string; measure: string | null }[] = [];
		for (let i = 1; i <= 15; i++) {
			const ing = detail[`strIngredient${i}`];
			if (!ing || !ing.trim()) continue;
			rawPairs.push({ ing: ing.trim(), measure: detail[`strMeasure${i}`] || null });
		}
		if (rawPairs.length > (IBA_MODE ? 8 : 6)) continue;

		// map ingredients -> categories, dropping garnishes
		const steps: Step[] = [];
		let unmapped: string | null = null;
		for (const { ing, measure } of rawPairs) {
			const key = ing.toLowerCase().trim();
			if (IGNORE.has(key)) continue;

			const category = CATEGORY_ALIAS[key];
			if (!category) {
				unmapped = ing;
				break;
			}

			const parsed = parseMeasure(measure);
			if (!parsed) continue;
			steps.push({
				category,
				qty: parsed.qty,
				unit: parsed.unit,
				desc: stepDesc(parsed.oz, parsed.unit, parsed.qty, ing.toLowerCase(), parsed.top),
			});
		}

		if (unmapped) {
			skippedUnmapped.push({ name, ing: unmapped });
			continue;
		}
		// not enough to be a real recipe
		if (steps.length < 2) continue;

		const spiritsPresent = new Set(
			steps.map((s) => CATEGORY_TO_SPIRIT[s.category]).filter(Boolean) as Spirit[]
		);
		const spirit = SPIRIT_PRIORITY.find((s) => spiritsPresent.has(s));
		if (!spirit) {
			skippedNoSpirit.push(name);
			continue;
		}

		if (DRY) {
			console.log(`  + ${name} [${spirit}] ${steps.map((s) => s.category).join(', ')}`);
			added.push({
				name,
				spirit,
				technique: 'Shaken',
				description: '',
				ratings: { sweetness: 0, dryness: 0, strength: 0, versatility: 0 },
				steps,
			});
			existingNames.add(normalize(name));
			continue;
		}

		// gpt fills description/technique/ratings
		let meta: Meta;
		try {
			meta = await fillMeta(
				name,
				spirit,
				rawPairs.map((p) => p.ing),
				detail.strInstructions || ''
			);
		} catch (e: any) {
			console.log(`  ! ${name} (gpt failed: ${e.message})`);
			continue;
		}

		added.push({
			name,
			spirit,
			technique: meta.technique,
			description: meta.description,
			ratings: meta.ratings,
			steps,
		});
		existingNames.add(normalize(name));
		console.log(`  + ${name} [${spirit}] ${meta.technique}`);
	}

	// 3) append to the json (preserving existing formatting), unless dry
	console.log(
		`\n${added.length} new, ${skippedExisting} already present, ${skippedNonIba} non-IBA, ${skippedUnmapped.length} unmapped, ${skippedNoSpirit.length} no base spirit`
	);
	if (skippedUnmapped.length) {
		console.log('\nunmapped ingredients (add to CATEGORY_ALIAS and re-run):');
		const seen = new Set<string>();
		for (const { ing } of skippedUnmapped) {
			if (seen.has(ing)) continue;
			seen.add(ing);
			console.log(`  - ${ing}`);
		}
	}

	if (DRY || added.length === 0) return;

	const closeIdx = rawFile.lastIndexOf(']');
	// ends with last '}'
	const before = rawFile.slice(0, closeIdx).replace(/\s*$/, '');
	const block = added.map(formatRecipe).join(',\n');
	fs.writeFileSync(RECIPES_PATH, `${before},\n${block}\n]\n`);
	console.log(`\nappended ${added.length} recipes to ${path.basename(RECIPES_PATH)}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
