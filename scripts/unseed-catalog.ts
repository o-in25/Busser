import 'dotenv/config';
import knex from 'knex';
import config from '../knexfile';
import recipes from '../seeds/core/data/global-catalog-recipes.json';

const WORKSPACE = 'ws-global-catalog';

async function main() {
	const db = knex(config.core);
	const names = recipes.map((r) => r.name);

	try {
		// find seeded recipes by name
		const rows = await db('recipe')
			.select('RecipeId', 'RecipeDescriptionId', 'RecipeName')
			.where('WorkspaceId', WORKSPACE)
			.whereIn('RecipeName', names);

		if (rows.length === 0) {
			console.log('no seeded recipes found');
			return;
		}

		console.log(`found ${rows.length} seeded recipes to delete`);

		const recipeIds = rows.map((r: any) => r.RecipeId);
		const descIds = rows.map((r: any) => r.RecipeDescriptionId);

		await db.transaction(async (trx) => {
			// recipestep and recipetechnique cascade on recipe delete
			const deleted = await trx('recipe').whereIn('RecipeId', recipeIds).del();
			console.log(`  deleted ${deleted} recipes (steps + techniques cascaded)`);

			// recipedescription is not cascaded, clean up orphans
			const descDeleted = await trx('recipedescription')
				.whereIn('RecipeDescriptionId', descIds)
				.del();
			console.log(`  deleted ${descDeleted} recipe descriptions`);
		});

		for (const row of rows) {
			console.log(`  removed: ${(row as any).RecipeName}`);
		}
	} finally {
		await db.destroy();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
