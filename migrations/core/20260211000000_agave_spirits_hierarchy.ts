/**
 * Fix the tequila/mezcal taxonomy.
 *
 * 1. Insert a new "Agave Spirits" parent category
 * 2. Make "Tequila" and "Mezcal" siblings under it
 * 3. Rename recipecategory 7 from "Tequila" to "Tequila & Mezcal"
 */
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// ── Step 1: Insert "Agave Spirits" parent category ──

	const tequila = await knex('category')
		.where('CategoryName', 'Tequila')
		.whereNull('ParentCategoryId')
		.first();

	if (!tequila) {
		throw new Error('Could not find top-level "Tequila" category');
	}

	const [agaveSpiritId] = await knex('category').insert({
		CategoryName: 'Agave Spirits',
		CategoryDescription:
			'A family of distilled spirits produced from agave plants, including tequila and mezcal.',
		WorkspaceId: tequila.WorkspaceId,
		ParentCategoryId: null,
	});

	// ── Step 2: Re-parent Tequila and Mezcal under Agave Spirits ──

	// Tequila becomes a child of Agave Spirits
	await knex('category')
		.where('CategoryId', tequila.CategoryId)
		.update({ ParentCategoryId: agaveSpiritId });

	// Mezcal moves from child-of-Tequila to child-of-Agave Spirits
	await knex('category')
		.where('CategoryName', 'Mezcal')
		.where('ParentCategoryId', tequila.CategoryId)
		.update({ ParentCategoryId: agaveSpiritId });

	// ── Step 3: Rename recipecategory "Tequila" → "Tequila & Mezcal" ──

	await knex('recipecategory')
		.where('RecipeCategoryId', 7)
		.update({ RecipeCategoryDescription: 'Tequila & Mezcal' });

	await knex('recipecategorydescription').where('RecipeCategoryId', 7).update({
		RecipeCategoryDescriptionText:
			'Tequila and mezcal are agave-based spirits from Mexico. Tequila, made exclusively from blue Weber agave, is known for its clean, bright flavor. Mezcal, produced from a wider variety of agave plants, is distinguished by its smoky, complex character. Together they form the agave spirits family.',
	});
}

export async function down(knex: Knex): Promise<void> {
	const agaveSpirits = await knex('category')
		.where('CategoryName', 'Agave Spirits')
		.whereNull('ParentCategoryId')
		.first();

	if (agaveSpirits) {
		// Move Tequila back to top-level
		await knex('category')
			.where('CategoryName', 'Tequila')
			.where('ParentCategoryId', agaveSpirits.CategoryId)
			.update({ ParentCategoryId: null });

		// Get the restored Tequila row
		const tequila = await knex('category')
			.where('CategoryName', 'Tequila')
			.whereNull('ParentCategoryId')
			.first();

		// Move Mezcal back under Tequila
		if (tequila) {
			await knex('category')
				.where('CategoryName', 'Mezcal')
				.where('ParentCategoryId', agaveSpirits.CategoryId)
				.update({ ParentCategoryId: tequila.CategoryId });
		}

		// Delete Agave Spirits
		await knex('category').where('CategoryId', agaveSpirits.CategoryId).del();
	}

	// Revert recipecategory
	await knex('recipecategory')
		.where('RecipeCategoryId', 7)
		.update({ RecipeCategoryDescription: 'Tequila' });

	await knex('recipecategorydescription').where('RecipeCategoryId', 7).update({
		RecipeCategoryDescriptionText:
			'Tequila is a distilled alcoholic beverage made primarily from the blue agave plant, native to the area surrounding the city of Tequila in the Mexican state of Jalisco. It is a type of mezcal, but with stricter production regulations and specific plant requirements.',
	});
}
