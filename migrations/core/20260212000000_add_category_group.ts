import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// create categorygroup lookup table
	await knex.schema.createTable('categorygroup', (t) => {
		t.increments('CategoryGroupId').primary();
		t.string('CategoryGroupName', 255).notNullable().unique();
		t.string('CategoryGroupDescription', 1000).nullable();
	});

	// seed groups
	await knex('categorygroup').insert([
		{ CategoryGroupName: 'Spirits', CategoryGroupDescription: 'Base spirits and distilled liquors' },
		{ CategoryGroupName: 'Liqueurs', CategoryGroupDescription: 'Sweet, flavored spirits' },
		{ CategoryGroupName: 'Fortified & Aromatized', CategoryGroupDescription: 'Fortified wines and vermouths' },
		{ CategoryGroupName: 'Bitters', CategoryGroupDescription: 'Bitters and amari' },
		{ CategoryGroupName: 'Sweeteners', CategoryGroupDescription: 'Syrups, sugars, and sweetening agents' },
		{ CategoryGroupName: 'Juices', CategoryGroupDescription: 'Fresh citrus and fruit juices' },
		{ CategoryGroupName: 'Mixers & Sodas', CategoryGroupDescription: 'Carbonated and non-alcoholic mixers' },
		{ CategoryGroupName: 'Other', CategoryGroupDescription: 'Dairy, eggs, and miscellaneous ingredients' },
	]);

	// add FK column on category
	await knex.schema.alterTable('category', (t) => {
		t.integer('CategoryGroupId').unsigned().nullable();
		t.foreign('CategoryGroupId', 'fk_category_categorygroup')
			.references('CategoryGroupId')
			.inTable('categorygroup');
	});

	// helper to get group id by name
	const groupId = async (name: string): Promise<number> => {
		const row = await knex('categorygroup').where({ CategoryGroupName: name }).first();
		return row.CategoryGroupId;
	};

	const spiritsId = await groupId('Spirits');
	const liqueursId = await groupId('Liqueurs');
	const fortifiedId = await groupId('Fortified & Aromatized');
	const bittersId = await groupId('Bitters');
	const sweetenersId = await groupId('Sweeteners');
	const juicesId = await groupId('Juices');
	const mixersId = await groupId('Mixers & Sodas');
	const otherId = await groupId('Other');

	// backfill helper
	const setGroup = async (groupId: number, names: string[]) => {
		for (const name of names) {
			await knex('category')
				.where({ CategoryName: name })
				.update({ CategoryGroupId: groupId });
		}
	};

	await setGroup(spiritsId, [
		'Rum', 'White Rum', 'Dark Rum', 'Gold Rum', 'Overproof Rum',
		'Jamaican Rum', 'Rhum Agricole (white)', 'Navy Rum', '151 Rum', 'Aged Rum',
		'Gin', 'London Dry Gin', 'Plymouth Gin', 'Old Tom Gin', 'Genever Gin',
		'Barrel Aged Gin', 'Beefeater Gin',
		'Whiskey', 'Bourbon Whiskey', 'Rye Whiskey',
		'Vodka', 'Plain Vodka', 'Flavored Vodka', 'Infused Vodka',
		'Agave Spirits', 'Tequila', 'Blanco Tequila', 'Reposado Tequila', 'Mezcal',
		'Brandy', 'Cognac', 'Absinthe',
	]);

	await setGroup(liqueursId, [
		'Orange Liqueur', 'Herbal Liqueur', 'Coffee Liquor', 'Blackcurrant Liqueur',
		'Curaçao', 'Cherry Heering', 'Velvet Falernum', 'Liqueur',
	]);

	await setGroup(fortifiedId, ['Fortified wine', 'Dry Vermouth', 'Sweet Vermouth']);

	await setGroup(bittersId, ['Bitters', 'Orange Bitters', 'Amaro']);

	await setGroup(sweetenersId, [
		'Syrup', 'Simple Syrup', 'Honey Syrup', 'Orgeat Syrup',
		'Agave Syrup', 'Cinnamon Simple Syrup', 'Grenadine', 'Sugar',
	]);

	await setGroup(juicesId, [
		'Lemon Juice', 'Lime Juice', 'Pineapple Juice', 'Grapefruit Juice',
	]);

	await setGroup(mixersId, ['Soda Water', 'Soda', 'Ginger Beer', 'Tonic Water']);

	await setGroup(otherId, ['Cream', 'Eggs', 'Espresso', 'Orange Flower Water']);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('category', (t) => {
		t.dropForeign([], 'fk_category_categorygroup');
		t.dropColumn('CategoryGroupId');
	});

	await knex.schema.dropTableIfExists('categorygroup');
}
