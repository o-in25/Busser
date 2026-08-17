import type { Knex } from 'knex';

// two data fixes in the global catalog, follow-ups to 20260813 (see defects.md):
//   1. Negroni & Boulevardier steps say "Campari" but point at Fernet Branca (a very
//      different amaro). re-point them to the real Campari Liqueur product, which
//      20260813 moved into its own "Campari" category — so ANY_IN_CATEGORY now scopes to
//      Campari (a user stocking Campari makes a Negroni; Fernet no longer counts).
//   2. the "Amaro" category was grouped under Bitters; it's a bitter liqueur, so regroup
//      it to Liqueurs (matches Aperol/Campari, and fixes base/modifier role assignment).
//
// scoped precisely: only the two steps whose description says Campari are touched — the
// legit Fernet steps (Alligator, Hanky Panky, Toronto) and Paper Plane's amaro are left alone.

const GLOBAL = 'ws-global-catalog';
const FERNET = 2183; // Fernet Branca — wrong product on the Campari steps
const CAMPARI = 2079; // Campari Liqueur — correct product (now in the "Campari" category)
const AMARO_CATEGORY = 65;
const GROUP_LIQUEURS = 2;
const GROUP_BITTERS = 4;

const campariSteps = (knex: Knex, productId: number) =>
	knex('recipestep')
		.where('ProductId', productId)
		.where('RecipeStepDescription', 'like', '%Campari%')
		.whereIn(
			'RecipeId',
			knex('recipe')
				.select('RecipeId')
				.where('WorkspaceId', GLOBAL)
				.whereIn('RecipeName', ['Negroni', 'Boulevardier'])
		);

export async function up(knex: Knex): Promise<void> {
	await campariSteps(knex, FERNET).update({ ProductId: CAMPARI });
	await knex('category')
		.where({ CategoryId: AMARO_CATEGORY, WorkspaceId: GLOBAL })
		.update({ CategoryGroupId: GROUP_LIQUEURS });
}

export async function down(knex: Knex): Promise<void> {
	await campariSteps(knex, CAMPARI).update({ ProductId: FERNET });
	await knex('category')
		.where({ CategoryId: AMARO_CATEGORY, WorkspaceId: GLOBAL })
		.update({ CategoryGroupId: GROUP_BITTERS });
}
