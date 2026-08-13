import type { Knex } from 'knex';

// fixes three taxonomy defects in the global catalog that make recipe ingredient
// substitutions and role grouping wrong. see .claude/backlog/defects.md for the audit.
//
//   1. the generic "Syrup" bucket (cat 20) lumps 5 flavour-distinct syrups together, so
//      ANY_IN_CATEGORY matching offers e.g. orgeat as a sub for ginger. we split it into
//      per-flavour child categories (mirroring how Raspberry Syrup is already modelled) and
//      re-point the products. matching keys off product.CategoryId, so moving the product is
//      all that's needed — recipe steps are untouched.
//   2. "Campari Liqueur" is mis-filed under "Bitters"; move it to its own liqueur category.
//   3. 16 categories have a null CategoryGroupId, which breaks base/modifier role grouping.
//      backfill from the parent's group where possible, plus two explicit parentless cases.
//
// every change is snapshotted so down() fully reverts it.

const GLOBAL = 'ws-global-catalog';

// categorygroup ids (stable, seeded)
const GROUP = { SPIRITS: 1, LIQUEURS: 2, FORTIFIED: 3, BITTERS: 4, SWEETENERS: 5, JUICES: 6, MIXERS: 7, OTHER: 8 };

const SYRUP_PARENT = 20; // existing "Syrup" category, becomes a true parent
const LIQUEUR_PARENT = 95; // existing "Liqueur" category

// new categories to create: [name, parentCategoryId, categoryGroupId]
const NEW_CATEGORIES: Array<[string, number, number]> = [
	['Ginger Syrup', SYRUP_PARENT, GROUP.SWEETENERS],
	['Honey Syrup', SYRUP_PARENT, GROUP.SWEETENERS],
	['Agave Syrup', SYRUP_PARENT, GROUP.SWEETENERS],
	['Orgeat Syrup', SYRUP_PARENT, GROUP.SWEETENERS],
	['Cinnamon Syrup', SYRUP_PARENT, GROUP.SWEETENERS],
	['Campari', LIQUEUR_PARENT, GROUP.LIQUEURS],
];

// product re-points: [productName, currentCategoryId, targetCategoryName]
const REPOINTS: Array<[string, number, string]> = [
	['Ginger Syrup', 20, 'Ginger Syrup'],
	['Honey Syrup', 20, 'Honey Syrup'],
	['Agave Syrup', 20, 'Agave Syrup'],
	['Orgeat Syrup', 20, 'Orgeat Syrup'],
	['Simple Syrup', 20, 'Simple Syrup'], // reuse existing cat 51
	['Cinnamon Simple Syrup', 51, 'Cinnamon Syrup'],
	['Campari Liqueur', 3, 'Campari'],
];

export async function up(knex: Knex): Promise<void> {
	// snapshot tables for reversibility
	if (!(await knex.schema.hasTable('taxonomy_cleanup_products'))) {
		await knex.schema.createTable('taxonomy_cleanup_products', (t) => {
			t.integer('ProductId').unsigned().primary();
			t.integer('PreviousCategoryId').notNullable();
		});
	}
	if (!(await knex.schema.hasTable('taxonomy_cleanup_categories'))) {
		await knex.schema.createTable('taxonomy_cleanup_categories', (t) => {
			t.integer('CategoryId').unsigned().primary();
			t.integer('PreviousParentCategoryId').nullable();
			t.integer('PreviousCategoryGroupId').nullable();
			t.boolean('WasCreated').notNullable().defaultTo(false);
		});
	}

	// --- snapshot the products we're about to move ---
	await knex.raw(
		`
		INSERT IGNORE INTO taxonomy_cleanup_products (ProductId, PreviousCategoryId)
		SELECT ProductId, CategoryId FROM product
		WHERE WorkspaceId = ? AND (
			(ProductName IN ('Ginger Syrup','Honey Syrup','Agave Syrup','Orgeat Syrup','Simple Syrup') AND CategoryId = 20)
			OR (ProductName = 'Cinnamon Simple Syrup' AND CategoryId = 51)
			OR (ProductName = 'Campari Liqueur' AND CategoryId = 3)
		)
	`,
		[GLOBAL]
	);

	// --- 1 & 2: create the specific categories, then re-point products into them ---
	for (const [name, parentId, groupId] of NEW_CATEGORIES) {
		const existing = await knex('category')
			.where({ WorkspaceId: GLOBAL, CategoryName: name })
			.first('CategoryId');
		if (!existing) {
			await knex('category').insert({
				CategoryName: name,
				CategoryDescription: null,
				ParentCategoryId: parentId,
				CategoryGroupId: groupId,
				WorkspaceId: GLOBAL,
			});
		}
		// mark as created so down() can delete it (safe: none of these names pre-existed)
		await knex.raw(
			`
			INSERT IGNORE INTO taxonomy_cleanup_categories (CategoryId, WasCreated)
			SELECT CategoryId, 1 FROM category WHERE WorkspaceId = ? AND CategoryName = ?
		`,
			[GLOBAL, name]
		);
	}

	for (const [productName, fromCategoryId, targetName] of REPOINTS) {
		await knex.raw(
			`
			UPDATE product
			SET CategoryId = (SELECT CategoryId FROM category WHERE WorkspaceId = ? AND CategoryName = ? LIMIT 1)
			WHERE WorkspaceId = ? AND ProductName = ? AND CategoryId = ?
		`,
			[GLOBAL, targetName, GLOBAL, productName, fromCategoryId]
		);
	}

	// promote the existing "Simple Syrup" category (51) to a proper child of "Syrup"
	await knex.raw(
		`
		INSERT IGNORE INTO taxonomy_cleanup_categories (CategoryId, PreviousParentCategoryId, PreviousCategoryGroupId, WasCreated)
		SELECT CategoryId, ParentCategoryId, CategoryGroupId, 0 FROM category WHERE WorkspaceId = ? AND CategoryId = 51
	`,
		[GLOBAL]
	);
	await knex.raw(`UPDATE category SET ParentCategoryId = ? WHERE WorkspaceId = ? AND CategoryId = 51`, [
		SYRUP_PARENT,
		GLOBAL,
	]);

	// --- 3: backfill null category groups ---
	// most null-group categories can inherit their parent's group
	await knex.raw(
		`
		INSERT IGNORE INTO taxonomy_cleanup_categories (CategoryId, PreviousParentCategoryId, PreviousCategoryGroupId, WasCreated)
		SELECT c.CategoryId, c.ParentCategoryId, c.CategoryGroupId, 0
		FROM category c JOIN category pc ON pc.CategoryId = c.ParentCategoryId
		WHERE c.WorkspaceId = ? AND c.CategoryGroupId IS NULL AND pc.CategoryGroupId IS NOT NULL
	`,
		[GLOBAL]
	);
	await knex.raw(
		`
		UPDATE category c JOIN category pc ON pc.CategoryId = c.ParentCategoryId
		SET c.CategoryGroupId = pc.CategoryGroupId
		WHERE c.WorkspaceId = ? AND c.CategoryGroupId IS NULL AND pc.CategoryGroupId IS NOT NULL
	`,
		[GLOBAL]
	);

	// the two parentless leftovers get explicit groups (Champagne → mixer, Coconut Cream → sweetener)
	await knex.raw(
		`
		INSERT IGNORE INTO taxonomy_cleanup_categories (CategoryId, PreviousParentCategoryId, PreviousCategoryGroupId, WasCreated)
		SELECT CategoryId, ParentCategoryId, CategoryGroupId, 0 FROM category
		WHERE WorkspaceId = ? AND CategoryName IN ('Champagne','Coconut Cream') AND CategoryGroupId IS NULL
	`,
		[GLOBAL]
	);
	await knex.raw(`UPDATE category SET CategoryGroupId = ? WHERE WorkspaceId = ? AND CategoryName = 'Champagne' AND CategoryGroupId IS NULL`, [
		GROUP.MIXERS,
		GLOBAL,
	]);
	await knex.raw(`UPDATE category SET CategoryGroupId = ? WHERE WorkspaceId = ? AND CategoryName = 'Coconut Cream' AND CategoryGroupId IS NULL`, [
		GROUP.SWEETENERS,
		GLOBAL,
	]);
}

export async function down(knex: Knex): Promise<void> {
	if (!(await knex.schema.hasTable('taxonomy_cleanup_products'))) return;

	// restore products to their original categories first (so created categories are empty)
	await knex.raw(`
		UPDATE product p JOIN taxonomy_cleanup_products s ON p.ProductId = s.ProductId
		SET p.CategoryId = s.PreviousCategoryId
	`);

	// restore modified existing categories (group + parent)
	await knex.raw(`
		UPDATE category c JOIN taxonomy_cleanup_categories s ON c.CategoryId = s.CategoryId
		SET c.CategoryGroupId = s.PreviousCategoryGroupId, c.ParentCategoryId = s.PreviousParentCategoryId
		WHERE s.WasCreated = 0
	`);

	// delete the categories we created
	await knex.raw(`
		DELETE c FROM category c JOIN taxonomy_cleanup_categories s ON c.CategoryId = s.CategoryId
		WHERE s.WasCreated = 1
	`);

	await knex.schema.dropTable('taxonomy_cleanup_products');
	await knex.schema.dropTable('taxonomy_cleanup_categories');
}
