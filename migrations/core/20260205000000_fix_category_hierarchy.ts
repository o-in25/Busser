/**
 * Fix category hierarchy - remove parent relationships for non-interchangeable categories.
 *
 * Keep parent relationships for spirits (children are interchangeable):
 * - Gin, Whiskey, Rum, Vodka, Tequila, Brandy
 *
 * Remove parent relationships for (children are NOT interchangeable):
 * - Juice, Syrup, Soda, Bitters, Vermouth, Liqueur, Cream
 */
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// Get parent category IDs by name
	const parentsToUnlink = [
		'Juice',
		'Syrup',
		'Soda',
		'Bitters',
		'Vermouth',
		'Liqueur',
		'Cream',
	];

	// Set ParentCategoryId = NULL for all children of these categories
	for (const parentName of parentsToUnlink) {
		const parent = await knex('category')
			.where('CategoryName', parentName)
			.whereNull('ParentCategoryId')
			.first();

		if (parent) {
			await knex('category')
				.where('ParentCategoryId', parent.CategoryId)
				.update({ ParentCategoryId: null });
		}
	}

	// Delete the now-empty parent categories (they have no products and no children)
	// Only delete if they have no products assigned directly
	for (const parentName of parentsToUnlink) {
		const parent = await knex('category')
			.where('CategoryName', parentName)
			.whereNull('ParentCategoryId')
			.first();

		if (parent) {
			const productCount = await knex('product')
				.where('CategoryId', parent.CategoryId)
				.count('* as count')
				.first();

			if (Number(productCount?.count) === 0) {
				await knex('category')
					.where('CategoryId', parent.CategoryId)
					.del();
			}
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	// This is a data correction migration - down would need to recreate
	// the parent categories and re-link children, which is complex.
	// For safety, we'll just note that this can't be easily reversed.
	console.warn('This migration cannot be automatically reversed. Manual intervention required.');
}
