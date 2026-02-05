/**
 * Replace BaseSpiritId-based matching with ParentCategoryId-based matching.
 *
 * 1. Add ANY_IN_PARENT_CATEGORY to MatchMode ENUM, migrate existing rows
 * 2. Set up parent-child category relationships
 * 3. Update views: basicrecipestep, availablerecipes
 * 4. Drop BaseSpiritId column and its FK
 */
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// ── Step 1: Modify MatchMode ENUM ──

	await knex.raw(`
		ALTER TABLE recipestep
		MODIFY MatchMode ENUM('EXACT_PRODUCT', 'ANY_IN_CATEGORY', 'ANY_IN_BASE_SPIRIT', 'ANY_IN_PARENT_CATEGORY')
		NOT NULL DEFAULT 'EXACT_PRODUCT'
	`);

	// Migrate existing ANY_IN_BASE_SPIRIT rows
	await knex.raw(`
		UPDATE recipestep SET MatchMode = 'ANY_IN_PARENT_CATEGORY'
		WHERE MatchMode = 'ANY_IN_BASE_SPIRIT'
	`);

	// Now remove old enum value
	await knex.raw(`
		ALTER TABLE recipestep
		MODIFY MatchMode ENUM('EXACT_PRODUCT', 'ANY_IN_CATEGORY', 'ANY_IN_PARENT_CATEGORY')
		NOT NULL DEFAULT 'EXACT_PRODUCT'
	`);

	// ── Step 2: Set up parent-child category relationships ──

	// Create new parent categories (Gin, Whiskey, Vodka, Tequila, Brandy, Liqueur)
	// Use a workspace from existing categories
	const [{ workspaceId }] = await knex.raw(
		`SELECT DISTINCT WorkspaceId as workspaceId FROM category WHERE WorkspaceId IS NOT NULL LIMIT 1`
	).then((r: any) => r[0] || [{ workspaceId: null }]);

	if (workspaceId) {
		// Insert new parent categories (only if they don't already exist)
		const insertParent = async (name: string) => {
			const existing = await knex('category')
				.where({ CategoryName: name, WorkspaceId: workspaceId })
				.first();
			if (existing) return existing.CategoryId;
			const [id] = await knex('category').insert({
				CategoryName: name,
				CategoryDescription: null,
				WorkspaceId: workspaceId,
				ParentCategoryId: null,
			});
			return id;
		};

		const ginId = await insertParent('Gin');
		const whiskeyId = await insertParent('Whiskey');
		const vodkaId = await insertParent('Vodka');
		const tequilaId = await insertParent('Tequila');
		const brandyId = await insertParent('Brandy');
		const liqueurId = await insertParent('Liqueur');

		// Existing parent categories (by name lookup)
		const getExistingId = async (name: string) => {
			const row = await knex('category')
				.where({ CategoryName: name, WorkspaceId: workspaceId })
				.first();
			return row?.CategoryId || null;
		};

		const rumId = await getExistingId('Rum');       // id 71
		const juiceId = await getExistingId('Juice');     // id 5
		const syrupId = await getExistingId('Syrup');     // id 20
		const bittersId = await getExistingId('Bitters'); // id 3
		const vermouthId = await getExistingId('Vermouth'); // id 6
		const sodaId = await getExistingId('Soda');       // id 67
		const creamId = await getExistingId('Cream');     // id 74

		// Helper to set ParentCategoryId for a list of child category names
		const setParent = async (parentId: number | null, childNames: string[]) => {
			if (!parentId) return;
			for (const name of childNames) {
				await knex('category')
					.where({ CategoryName: name, WorkspaceId: workspaceId })
					.whereNull('ParentCategoryId')
					.update({ ParentCategoryId: parentId });
			}
		};

		// Gin children
		await setParent(ginId, [
			'London Dry Gin', 'Plymouth Gin', 'Old Tom Gin', 'Genever Gin',
			'Barrel Aged Gin', 'Beefeater Gin',
		]);

		// Whiskey children
		await setParent(whiskeyId, ['Bourbon Whiskey', 'Rye Whiskey']);

		// Rum children
		await setParent(rumId, [
			'White Rum', 'Dark Rum', 'Overproof Rum', 'Gold Rum',
			'Jamaican Rum', 'Rhum Agricole (white)',
		]);

		// Vodka children
		await setParent(vodkaId, ['Plain Vodka', 'Flavored Vodka', 'Infused Vodka']);

		// Tequila children
		await setParent(tequilaId, ['Reposado Tequila', 'Blanco Tequila']);

		// Brandy children
		await setParent(brandyId, ['Cognac']);

		// Juice children
		await setParent(juiceId, ['Lemon Juice', 'Lime Juice', 'Pineapple Juice']);

		// Syrup children
		await setParent(syrupId, [
			'Simple Syrup', 'Honey Syrup', 'Agave Syrup',
			'Cinnamon Simple Syrup', 'Orgeat Syrup', 'Grenadine',
		]);

		// Bitters children
		await setParent(bittersId, ['Orange Bitters']);

		// Vermouth children
		await setParent(vermouthId, ['Dry Vermouth', 'Sweet Vermouth']);

		// Soda children
		await setParent(sodaId, ['Soda Water']);
		// Tonic Water (73) already has ParentCategoryId=67

		// Cream children
		// Heavy Cream (77) already has ParentCategoryId=74

		// Liqueur children
		await setParent(liqueurId, [
			'Herbal Liqueur', 'Orange Liqueur', 'Blackcurrant Liqueur',
			'Cherry Heering', 'Curaçao', 'Amaro',
		]);
	}

	// ── Step 3: Update views ──

	// Drop views that depend on basicrecipestep or reference BaseSpiritId
	await knex.raw('DROP VIEW IF EXISTS availablerecipes');
	await knex.raw('DROP VIEW IF EXISTS basicrecipestep');

	// Recreate basicrecipestep with ParentCategoryId-based matching
	await knex.raw(`
		CREATE VIEW basicrecipestep AS
		SELECT
			rs.RecipeId, rs.RecipeStepId, rs.RecipeStepDescription,
			rs.MatchMode, rs.CategoryId AS StepCategoryId,
			p.ProductName, p.ProductId, c.CategoryId, c.CategoryName,
			c.CategoryDescription, c.ParentCategoryId,
			pc.CategoryName AS ParentCategoryName,
			s.SupplierName, s.SupplierDetails,
			rs.ProductIdQuantityInMilliliters, rs.ProductIdQuantityUnit,
			p.ProductInStockQuantity, p.ProductPricePerUnit,
			p.ProductUnitSizeInMilliliters, p.ProductProof,
			p.WorkspaceId,
			CASE
				WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
					CASE WHEN p.ProductInStockQuantity > 0 THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p2
						WHERE p2.CategoryId = c.CategoryId
						AND p2.ProductInStockQuantity > 0
						AND p2.WorkspaceId = p.WorkspaceId
					) THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_PARENT_CATEGORY' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p4
						JOIN category c4 ON p4.CategoryId = c4.CategoryId
						WHERE (c4.ParentCategoryId = c.ParentCategoryId
						       OR c4.CategoryId = c.ParentCategoryId)
						AND c.ParentCategoryId IS NOT NULL
						AND p4.ProductInStockQuantity > 0
						AND p4.WorkspaceId = p.WorkspaceId
					) THEN 1 ELSE 0 END
				ELSE 0
			END AS EffectiveInStock
		FROM recipestep rs
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		LEFT JOIN category pc ON c.ParentCategoryId = pc.CategoryId
		JOIN supplier s ON p.SupplierId = s.SupplierId
	`);

	// Recreate availablerecipes with updated matching
	await knex.raw(`
		CREATE VIEW availablerecipes AS
		SELECT br.*
		FROM baserecipe br
		WHERE br.RecipeId IN (
			SELECT rs.RecipeId
			FROM recipestep rs
			JOIN product p ON rs.ProductId = p.ProductId
			JOIN category c ON p.CategoryId = c.CategoryId
			GROUP BY rs.RecipeId
			HAVING SUM(
				CASE
					WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
						CASE WHEN p.ProductInStockQuantity > 0 THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p2
							WHERE p2.CategoryId = COALESCE(rs.CategoryId, p.CategoryId)
							AND p2.ProductInStockQuantity > 0
							AND p2.WorkspaceId = p.WorkspaceId
						) THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_PARENT_CATEGORY' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p4
							JOIN category c4 ON p4.CategoryId = c4.CategoryId
							WHERE (c4.ParentCategoryId = c.ParentCategoryId
							       OR c4.CategoryId = c.ParentCategoryId)
							AND c.ParentCategoryId IS NOT NULL
							AND p4.ProductInStockQuantity > 0
							AND p4.WorkspaceId = p.WorkspaceId
						) THEN 1 ELSE 0 END
					ELSE 0
				END
			) = COUNT(*)
		)
	`);

	// ── Step 4: Drop BaseSpiritId column ──

	await knex.schema.alterTable('category', (t) => {
		t.dropForeign([], 'fk_category_basespirit');
		t.dropColumn('BaseSpiritId');
	});
}

export async function down(knex: Knex): Promise<void> {
	// Re-add BaseSpiritId column
	await knex.schema.alterTable('category', (t) => {
		t.integer('BaseSpiritId').unsigned().nullable();
		t.foreign('BaseSpiritId', 'fk_category_basespirit').references(
			'recipecategory.RecipeCategoryId'
		);
	});

	// Restore ENUM with ANY_IN_BASE_SPIRIT
	await knex.raw(`
		ALTER TABLE recipestep
		MODIFY MatchMode ENUM('EXACT_PRODUCT', 'ANY_IN_CATEGORY', 'ANY_IN_PARENT_CATEGORY', 'ANY_IN_BASE_SPIRIT')
		NOT NULL DEFAULT 'EXACT_PRODUCT'
	`);

	await knex.raw(`
		UPDATE recipestep SET MatchMode = 'ANY_IN_BASE_SPIRIT'
		WHERE MatchMode = 'ANY_IN_PARENT_CATEGORY'
	`);

	await knex.raw(`
		ALTER TABLE recipestep
		MODIFY MatchMode ENUM('EXACT_PRODUCT', 'ANY_IN_CATEGORY', 'ANY_IN_BASE_SPIRIT')
		NOT NULL DEFAULT 'EXACT_PRODUCT'
	`);

	// Restore views
	await knex.raw('DROP VIEW IF EXISTS availablerecipes');
	await knex.raw('DROP VIEW IF EXISTS basicrecipestep');

	await knex.raw(`
		CREATE VIEW basicrecipestep AS
		SELECT
			rs.RecipeId, rs.RecipeStepId, rs.RecipeStepDescription,
			rs.MatchMode, rs.CategoryId AS StepCategoryId,
			p.ProductName, p.ProductId, c.CategoryId, c.CategoryName,
			c.CategoryDescription, c.BaseSpiritId,
			s.SupplierName, s.SupplierDetails,
			rs.ProductIdQuantityInMilliliters, rs.ProductIdQuantityUnit,
			p.ProductInStockQuantity, p.ProductPricePerUnit,
			p.ProductUnitSizeInMilliliters, p.ProductProof,
			p.WorkspaceId,
			CASE
				WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
					CASE WHEN p.ProductInStockQuantity > 0 THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p2
						WHERE p2.CategoryId = c.CategoryId
						AND p2.ProductInStockQuantity > 0
						AND p2.WorkspaceId = p.WorkspaceId
					) THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_BASE_SPIRIT' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p3
						JOIN category c3 ON p3.CategoryId = c3.CategoryId
						WHERE c3.BaseSpiritId = c.BaseSpiritId
						AND c.BaseSpiritId IS NOT NULL
						AND p3.ProductInStockQuantity > 0
						AND p3.WorkspaceId = p.WorkspaceId
					) THEN 1 ELSE 0 END
				ELSE 0
			END AS EffectiveInStock
		FROM recipestep rs
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		JOIN supplier s ON p.SupplierId = s.SupplierId
	`);

	await knex.raw(`
		CREATE VIEW availablerecipes AS
		SELECT br.*
		FROM baserecipe br
		WHERE br.RecipeId IN (
			SELECT rs.RecipeId
			FROM recipestep rs
			JOIN product p ON rs.ProductId = p.ProductId
			JOIN category c ON p.CategoryId = c.CategoryId
			GROUP BY rs.RecipeId
			HAVING SUM(
				CASE
					WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
						CASE WHEN p.ProductInStockQuantity > 0 THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p2
							WHERE p2.CategoryId = COALESCE(rs.CategoryId, p.CategoryId)
							AND p2.ProductInStockQuantity > 0
							AND p2.WorkspaceId = p.WorkspaceId
						) THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_BASE_SPIRIT' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p3
							JOIN category c3 ON p3.CategoryId = c3.CategoryId
							WHERE c3.BaseSpiritId = c.BaseSpiritId
							AND c.BaseSpiritId IS NOT NULL
							AND p3.ProductInStockQuantity > 0
							AND p3.WorkspaceId = p.WorkspaceId
						) THEN 1 ELSE 0 END
					ELSE 0
				END
			) = COUNT(*)
		)
	`);
}
