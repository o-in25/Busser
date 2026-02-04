/**
 * Seed reference data for app_d: recipe categories, descriptions, and mixing techniques.
 * Idempotent — safe to run multiple times.
 */
import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
	// ── recipe categories (base spirits) ──

	await knex('recipecategory')
		.insert([
			{ RecipeCategoryId: 4, RecipeCategoryDescription: 'Whiskey' },
			{ RecipeCategoryId: 5, RecipeCategoryDescription: 'Gin' },
			{ RecipeCategoryId: 6, RecipeCategoryDescription: 'Vodka' },
			{ RecipeCategoryId: 7, RecipeCategoryDescription: 'Tequila' },
			{ RecipeCategoryId: 8, RecipeCategoryDescription: 'Rum' },
			{ RecipeCategoryId: 9, RecipeCategoryDescription: 'Brandy' },
		])
		.onConflict('RecipeCategoryId')
		.ignore();

	// ── recipe category descriptions ──

	await knex('recipecategorydescription')
		.insert([
			{
				RecipeCategoryDescriptionId: 1,
				RecipeCategoryId: 4,
				RecipeCategoryDescriptionText:
					'Whiskey is a distilled alcoholic beverage made from fermented grain mash. It is typically aged in wooden barrels, which give it distinct flavors and color.',
				RecipeCategoryDescriptionImageUrl:
					'https://storage.googleapis.com/busser/assets/whiskey.jpg',
			},
			{
				RecipeCategoryDescriptionId: 2,
				RecipeCategoryId: 5,
				RecipeCategoryDescriptionText:
					'Gin is a distilled alcoholic beverage that gets its primary flavor from juniper berries. It has a distinctive, fresh taste that ranges from herbal to citrusy, depending on the botanicals used in its production.',
				RecipeCategoryDescriptionImageUrl: 'https://storage.googleapis.com/busser/assets/gin.jpg',
			},
			{
				RecipeCategoryDescriptionId: 3,
				RecipeCategoryId: 6,
				RecipeCategoryDescriptionText:
					'Vodka is a clear distilled alcoholic beverage, typically made from fermented grains or potatoes. It is known for its neutral flavor and smoothness, making it a popular base for many cocktails.',
				RecipeCategoryDescriptionImageUrl: 'https://storage.googleapis.com/busser/assets/vodka.jpg',
			},
			{
				RecipeCategoryDescriptionId: 4,
				RecipeCategoryId: 7,
				RecipeCategoryDescriptionText:
					'Tequila is a distilled alcoholic beverage made primarily from the blue agave plant, native to the area surrounding the city of Tequila in the Mexican state of Jalisco. It is a type of mezcal, but with stricter production regulations and specific plant requirements.',
				RecipeCategoryDescriptionImageUrl:
					'https://storage.googleapis.com/busser/assets/tequila.jpg',
			},
			{
				RecipeCategoryDescriptionId: 5,
				RecipeCategoryId: 8,
				RecipeCategoryDescriptionText:
					'Rum is a distilled alcoholic beverage made from sugarcane byproducts, such as molasses or sugarcane juice. It is commonly produced in the Caribbean and Latin America, but also in other parts of the world.',
				RecipeCategoryDescriptionImageUrl: 'https://storage.googleapis.com/busser/assets/rum.jpg',
			},
			{
				RecipeCategoryDescriptionId: 6,
				RecipeCategoryId: 9,
				RecipeCategoryDescriptionText:
					'Brandy is a distilled alcoholic beverage made from fermented fruit juice, primarily grapes, but it can also be made from other fruits like apples, pears, or plums. The name "brandy" comes from the Dutch word "brandewijn," meaning "burnt wine," referring to the process of distillation.',
				RecipeCategoryDescriptionImageUrl:
					'https://storage.googleapis.com/busser/assets/brandy.jpg',
			},
		])
		.onConflict('RecipeCategoryDescriptionId')
		.ignore();

	// ── mixing techniques ──

	await knex('recipetechniquedescription')
		.insert([
			{
				RecipeTechniqueDescriptionId: 1,
				RecipeTechniqueDescriptionText: 'Stirred',
				RecipeTechniqueDilutionPercentage: 20,
				RecipeTechniqueDescriptionInstructions:
					'Combine ingredients in a mixing glass with ice and stir smoothly for 20–30 seconds before straining into a chilled glass.',
				RecipeTechniqueDescriptionImageUrl:
					'https://storage.googleapis.com/busser/assets/mixing-glass.jpg',
			},
			{
				RecipeTechniqueDescriptionId: 2,
				RecipeTechniqueDescriptionText: 'Shaken',
				RecipeTechniqueDilutionPercentage: 30,
				RecipeTechniqueDescriptionInstructions:
					'Combine ingredients in a shaker with ice and shake vigorously for 10–15 seconds before straining into the serving glass.',
				RecipeTechniqueDescriptionImageUrl:
					'https://storage.googleapis.com/busser/assets/shaker.jpg',
			},
			{
				RecipeTechniqueDescriptionId: 3,
				RecipeTechniqueDescriptionText: 'Dry Shaken',
				RecipeTechniqueDilutionPercentage: 2,
				RecipeTechniqueDescriptionInstructions:
					'Shake ingredients without ice for 10–15 seconds to emulsify, then add ice, shake briefly, and strain.',
				RecipeTechniqueDescriptionImageUrl:
					'https://storage.googleapis.com/busser/assets/shaker.jpg',
			},
			{
				RecipeTechniqueDescriptionId: 4,
				RecipeTechniqueDescriptionText: 'Blended',
				RecipeTechniqueDilutionPercentage: 40,
				RecipeTechniqueDescriptionInstructions:
					'Combine ingredients and ice in a blender and blend until smooth or the desired texture is reached, then pour into the serving glass.',
				RecipeTechniqueDescriptionImageUrl:
					'https://storage.googleapis.com/busser/assets/blender.jpg',
			},
			{
				RecipeTechniqueDescriptionId: 5,
				RecipeTechniqueDescriptionText: 'Whip Shaken',
				RecipeTechniqueDilutionPercentage: 35,
				RecipeTechniqueDescriptionInstructions:
					'Shake ingredients with a small amount of crushed ice until fully melted, then pour unstrained into the serving glass and top with ice if needed.',
				RecipeTechniqueDescriptionImageUrl:
					'https://storage.googleapis.com/busser/assets/shaker.jpg',
			},
		])
		.onConflict('RecipeTechniqueDescriptionId')
		.ignore();
}
