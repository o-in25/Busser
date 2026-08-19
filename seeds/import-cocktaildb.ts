import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import knex from 'knex';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { z } from 'zod';
import config from '../knexfile';

const WORKSPACE = process.env.GLOBAL_WORKSPACE || 'ws-global-catalog';

// read-only ingest: walks thecocktaildb, transforms IBA classics into busser's
// recipe json shape, and APPENDS new ones to global-catalog-recipes.json.
// never touches the db — seed:core inserts them later (as drafts).
// run: pnpm import:cocktaildb [--limit=N] [--dry]

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_PATH = path.join(__dirname, './core/data/global-catalog-recipes.json');
const API = 'https://www.thecocktaildb.com/api/json/v1/1';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const ALL = args.includes('--all'); // ignore the IBA gate — see everything the mappers accept
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

// valid busser spirits (recipecategory) and techniques (see 01_reference_data.ts)
type Spirit = 'Whiskey' | 'Gin' | 'Vodka' | 'Tequila' | 'Rum' | 'Brandy';
const TECHNIQUES = ['Stirred', 'Shaken', 'Dry Shaken', 'Blended', 'Whip Shaken'] as const;

// base spirit inferred from which spirit-category ingredient appears (by priority).
// (the free cocktaildb key throttles filter.php to 1 result, so we discover via
// search.php?f=<letter> instead and infer the spirit from the mapped ingredients.)
const CATEGORY_TO_SPIRIT: Record<string, Spirit> = {
	'London Dry Gin': 'Gin',
	'Old Tom Gin': 'Gin',
	'Plain Vodka': 'Vodka',
	'Flavored Vodka': 'Vodka',
	'Blanco Tequila': 'Tequila',
	'Reposado Tequila': 'Tequila',
	Mezcal: 'Tequila',
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
const SPIRIT_PRIORITY: Spirit[] = ['Whiskey', 'Gin', 'Tequila', 'Rum', 'Brandy', 'Vodka'];

// cocktaildb ingredient name (lowercased) -> busser category (aligned to existing json vocab)
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
	'angostura bitters': 'Bitters',
	bitters: 'Bitters',
	'orange bitters': 'Orange Bitters',
	'soda water': 'Soda Water',
	'club soda': 'Soda Water',
	'carbonated water': 'Soda Water',
	'coca-cola': 'Cola',
	cola: 'Cola',
	champagne: 'Champagne',
	prosecco: 'Champagne',
	'egg white': 'Eggs',
	egg: 'Eggs',
	mint: 'Mint',
};

// garnishes / non-ingredients — drop the step, keep the recipe
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
// note: 'lemon'/'lime' appear both as juice aliases and as garnishes; the measure
// disambiguates in practice (garnish rows have no/whole measures), but we keep them
// in CATEGORY_ALIAS so a measured "Lemon" maps to juice. bare garnish rows without a
// parseable measure are dropped by parseMeasure returning null.

const normalize = (s: string): string =>
	s
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');

// parse cocktaildb's free-form measure -> { qty, unit } in busser storage terms
// (unit is 'ml' | 'dash' | 'barspoon' | 'tsp'); returns null to drop the step
function parseMeasure(raw: string | null): { qty: number; unit: string; oz: number | null } | null {
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

	// top / fill / splash -> treat as a top-off ~60ml
	if (/^(top|fill|splash)/.test(s) || /to taste/.test(s)) {
		return { qty: 60, unit: 'ml', oz: 2 };
	}

	// explicit ml / cl
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
		const oz = parseFraction(m[1]); // 1 shot ≈ 1oz/30ml
		return { qty: Math.round(oz * 30), unit: 'ml', oz };
	}

	// oz (with optional fractions like "1 1/2 oz", "1/2 oz")
	m = s.match(/^([\d./\s]+)\s*(oz|ounce)/);
	if (m) {
		const oz = parseFraction(m[1]);
		return { qty: Math.round(oz * 30), unit: 'ml', oz };
	}

	// bare "1/2" or "1" with no unit and a spirit-ish context is ambiguous — drop it
	return null;
}

// "1 1/2" -> 1.5, "1/2" -> 0.5, "2" -> 2
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

// human-readable step desc matching existing convention ("Add 1.5oz gin")
function stepDesc(oz: number | null, unit: string, qty: number, ingredient: string): string {
	if (unit === 'dash') return `Add ${qty} ${qty === 1 ? 'dash' : 'dashes'} ${ingredient}`;
	if (unit === 'barspoon')
		return `Add ${qty} ${qty === 1 ? 'barspoon' : 'barspoons'} ${ingredient}`;
	if (unit === 'tsp') return `Add ${qty} tsp ${ingredient}`;
	if (oz && oz >= 2) return `Top with ${ingredient}`;
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

// format one recipe to match the existing json style (tabs, inline steps)
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

	// 1) walk a-z via search.php?f=<letter> — returns full details (incl strIBA)
	const seenIds = new Set<string>();
	const drinks: any[] = [];
	for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
		const data = await fetchJson(`${API}/search.php?f=${letter}`);
		for (const d of data.drinks || []) {
			if (seenIds.has(d.idDrink)) continue;
			seenIds.add(d.idDrink);
			drinks.push(d);
		}
	}
	console.log(`discovered ${drinks.length} unique drinks`);

	// 2) filter to IBA + <=6 ingredients + not already present
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
		if (!ALL && !detail.strIBA) {
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
		if (rawPairs.length > 6) continue;

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
			if (!parsed) continue; // unmeasured garnish-like row -> drop step
			steps.push({
				category,
				qty: parsed.qty,
				unit: parsed.unit,
				desc: stepDesc(parsed.oz, parsed.unit, parsed.qty, ing.toLowerCase()),
			});
		}

		if (unmapped) {
			skippedUnmapped.push({ name, ing: unmapped });
			continue;
		}
		if (steps.length < 2) continue; // not enough to be a real recipe

		// infer base spirit from the mapped ingredient categories (by priority)
		const spiritsPresent = new Set(
			steps.map((s) => CATEGORY_TO_SPIRIT[s.category]).filter(Boolean) as Spirit[]
		);
		const spirit = SPIRIT_PRIORITY.find((s) => spiritsPresent.has(s));
		if (!spirit) {
			skippedNoSpirit.push(name); // liqueur-only / no base spirit we recognize
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
	const before = rawFile.slice(0, closeIdx).replace(/\s*$/, ''); // ends with last '}'
	const block = added.map(formatRecipe).join(',\n');
	fs.writeFileSync(RECIPES_PATH, `${before},\n${block}\n]\n`);
	console.log(`\nappended ${added.length} recipes to ${path.basename(RECIPES_PATH)}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
