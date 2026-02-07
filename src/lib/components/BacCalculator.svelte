<script lang="ts">
	import {
		Beer,
		Calculator,
		Clock,
		GlassWater,
		Martini,
		Minus,
		Plus,
		Scale,
		Search,
		TriangleAlert,
		User,
		Wine,
	} from 'lucide-svelte';
	import type { View } from '$lib/types';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		calculateAlcoholGrams,
		calculateAbv,
		calculateBac,
		getImpairmentLevel,
		estimateTimeUntilSober,
		ALCOHOL_DENSITY,
	} from '$lib/math';

	type RecipeWithSteps = {
		recipe: View.BasicRecipe;
		recipeSteps: View.BasicRecipeStep[];
	};

	interface Props {
		recipes: RecipeWithSteps[];
	}

	let { recipes }: Props = $props();

	// Generic drink presets (not from catalog)
	// Alcohol grams calculated as: volume(ml) * ABV * density(0.789)
	const genericDrinks = [
		{
			id: 'beer',
			name: 'Beer (12 oz, 5%)',
			alcoholGrams: 355 * 0.05 * ALCOHOL_DENSITY, // ~14g
			abv: 5,
			icon: Beer,
		},
		{
			id: 'wine',
			name: 'Wine (5 oz, 12%)',
			alcoholGrams: 148 * 0.12 * ALCOHOL_DENSITY, // ~14g
			abv: 12,
			icon: Wine,
		},
		{
			id: 'shot',
			name: 'Shot (1.5 oz, 40%)',
			alcoholGrams: 44 * 0.4 * ALCOHOL_DENSITY, // ~14g
			abv: 40,
			icon: GlassWater,
		},
	];

	// User inputs
	let weight = $state('');
	let weightUnit = $state<'kg' | 'lbs'>('lbs');
	let gender = $state<'male' | 'female'>('male');
	let timeSinceDrinking = $state('');
	let timeUnit = $state<'hours' | 'minutes'>('hours');

	// Autocomplete state
	let searchQuery = $state('');
	let showDropdown = $state(false);

	// Selected drinks with quantities (recipeId for catalog drinks, or generic drink id as negative)
	let selectedDrinks = $state<
		{ recipeId: number | string; quantity: number; isGeneric?: boolean }[]
	>([]);

	// Calculation results
	let hasCalculated = $state(false);
	let bacResult = $state(0);
	let impairment = $state<ReturnType<typeof getImpairmentLevel>>({
		level: 'Sober',
		description: 'No alcohol detected',
		color: 'green',
	});
	let timeUntilSober = $state(0);

	// Derived values
	const weightInKg = $derived(
		weightUnit === 'kg' ? parseFloat(weight) || 0 : (parseFloat(weight) || 0) * 0.453592
	);

	const timeInHours = $derived(
		timeUnit === 'hours'
			? parseFloat(timeSinceDrinking) || 0
			: (parseFloat(timeSinceDrinking) || 0) / 60
	);

	// Filter recipes based on search query
	const filteredRecipes = $derived(
		searchQuery.trim()
			? recipes.filter((r) =>
					r.recipe.recipeName?.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: recipes
	);

	// Filter generic drinks based on search query
	const filteredGenericDrinks = $derived(
		searchQuery.trim()
			? genericDrinks.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: genericDrinks
	);

	// Calculate ABV for a recipe
	function getRecipeAbv(recipe: RecipeWithSteps): string {
		return calculateAbv(
			recipe.recipeSteps.map((s) => ({
				productIdQuantityInMilliliters: s.productIdQuantityInMilliliters,
				productProof: s.productProof,
			})),
			recipe.recipe.recipeTechniqueDescriptionId || 2
		);
	}

	function addDrink(recipeId: number | string, isGeneric = false) {
		const existing = selectedDrinks.find(
			(d) => d.recipeId === recipeId && d.isGeneric === isGeneric
		);
		if (existing) {
			existing.quantity++;
			selectedDrinks = [...selectedDrinks];
		} else {
			selectedDrinks = [...selectedDrinks, { recipeId, quantity: 1, isGeneric }];
		}
		searchQuery = '';
		showDropdown = false;
		if (hasCalculated) {
			calculate();
		}
	}

	function removeDrink(recipeId: number | string, isGeneric = false) {
		const existing = selectedDrinks.find(
			(d) => d.recipeId === recipeId && d.isGeneric === isGeneric
		);
		if (existing) {
			if (existing.quantity > 1) {
				existing.quantity--;
				selectedDrinks = [...selectedDrinks];
			} else {
				selectedDrinks = selectedDrinks.filter(
					(d) => !(d.recipeId === recipeId && d.isGeneric === isGeneric)
				);
			}
			if (hasCalculated) {
				calculate();
			}
		}
	}

	function incrementDrink(recipeId: number | string, isGeneric = false) {
		const existing = selectedDrinks.find(
			(d) => d.recipeId === recipeId && d.isGeneric === isGeneric
		);
		if (existing) {
			existing.quantity++;
			selectedDrinks = [...selectedDrinks];
			if (hasCalculated) {
				calculate();
			}
		}
	}

	function getRecipeById(recipeId: number): RecipeWithSteps | undefined {
		return recipes.find((r) => r.recipe.recipeId === recipeId);
	}

	function getGenericDrinkById(id: string) {
		return genericDrinks.find((d) => d.id === id);
	}

	function calculate() {
		let totalAlcoholGrams = 0;

		for (const drink of selectedDrinks) {
			if (drink.isGeneric) {
				const genericDrink = getGenericDrinkById(drink.recipeId as string);
				if (genericDrink) {
					totalAlcoholGrams += genericDrink.alcoholGrams * drink.quantity;
				}
			} else {
				const recipe = getRecipeById(drink.recipeId as number);
				if (recipe) {
					const alcoholGrams = calculateAlcoholGrams(
						recipe.recipeSteps.map((s) => ({
							productIdQuantityInMilliliters: s.productIdQuantityInMilliliters,
							productProof: s.productProof,
						})),
						recipe.recipe.recipeTechniqueDescriptionId || 2
					);
					totalAlcoholGrams += alcoholGrams * drink.quantity;
				}
			}
		}

		bacResult = calculateBac(totalAlcoholGrams, weightInKg, gender, timeInHours);
		impairment = getImpairmentLevel(bacResult);
		timeUntilSober = estimateTimeUntilSober(bacResult);
		hasCalculated = true;
	}

	function toggleWeightUnit() {
		if (weightUnit === 'kg') {
			const currentKg = parseFloat(weight) || 0;
			weight = currentKg ? (currentKg * 2.20462).toFixed(0) : '';
			weightUnit = 'lbs';
		} else {
			const currentLbs = parseFloat(weight) || 0;
			weight = currentLbs ? (currentLbs * 0.453592).toFixed(0) : '';
			weightUnit = 'kg';
		}
	}

	function toggleTimeUnit() {
		if (timeUnit === 'hours') {
			const currentHours = parseFloat(timeSinceDrinking) || 0;
			timeSinceDrinking = currentHours ? (currentHours * 60).toFixed(0) : '';
			timeUnit = 'minutes';
		} else {
			const currentMinutes = parseFloat(timeSinceDrinking) || 0;
			timeSinceDrinking = currentMinutes ? (currentMinutes / 60).toFixed(1) : '';
			timeUnit = 'hours';
		}
	}

	function handleSearchFocus() {
		showDropdown = true;
	}

	function handleSearchBlur() {
		// Delay to allow click events on dropdown items
		setTimeout(() => {
			showDropdown = false;
		}, 150);
	}

	const colorClasses = {
		green: 'bg-green-500/10 border-green-500/20 text-green-600',
		yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
		orange: 'bg-orange-500/10 border-orange-500/20 text-orange-600',
		red: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
	};
</script>

<div class="space-y-6">
	<!-- Responsible Drinking Disclaimer -->
	<Alert.Root variant="destructive" class="border-rose-500/50 bg-rose-500/10">
		<TriangleAlert class="h-4 w-4" />
		<Alert.Title>Important Disclaimer</Alert.Title>
		<Alert.Description class="text-sm space-y-1">
			<p>
				This calculator provides <strong>estimates only</strong> for educational purposes. Individual
				metabolism varies significantly based on many factors.
			</p>
			<p class="font-semibold">
				Never use this to determine if you are safe to drive. When in doubt, use a designated driver
				or rideshare.
			</p>
		</Alert.Description>
	</Alert.Root>

	<!-- Input Section -->
	<div class="grid gap-4 sm:grid-cols-3">
		<!-- Weight Input -->
		<div class="space-y-2">
			<Label for="weight" class="flex items-center gap-2">
				<Scale class="h-4 w-4 text-muted-foreground" />
				Body Weight
			</Label>
			<div class="flex gap-2">
				<div class="relative flex-1">
					<Input
						id="weight"
						type="number"
						bind:value={weight}
						placeholder={weightUnit === 'lbs' ? 'e.g. 150' : 'e.g. 70'}
						class="pr-12"
					/>
					<button
						type="button"
						onclick={toggleWeightUnit}
						class="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-1"
					>
						{weightUnit}
					</button>
				</div>
			</div>
		</div>

		<!-- Gender Selection -->
		<div class="space-y-2">
			<Label class="flex items-center gap-2">
				<User class="h-4 w-4 text-muted-foreground" />
				Biological Sex
			</Label>
			<div class="flex gap-2">
				<Button
					variant={gender === 'male' ? 'default' : 'outline'}
					size="sm"
					class="flex-1"
					onclick={() => {
						gender = 'male';
						if (hasCalculated) calculate();
					}}
				>
					Male
				</Button>
				<Button
					variant={gender === 'female' ? 'default' : 'outline'}
					size="sm"
					class="flex-1"
					onclick={() => {
						gender = 'female';
						if (hasCalculated) calculate();
					}}
				>
					Female
				</Button>
			</div>
			<p class="text-xs text-muted-foreground">Affects Widmark factor in calculation</p>
		</div>

		<!-- Time Input -->
		<div class="space-y-2">
			<Label for="time" class="flex items-center gap-2">
				<Clock class="h-4 w-4 text-muted-foreground" />
				Time Since First Drink
			</Label>
			<div class="relative">
				<Input
					id="time"
					type="number"
					step={timeUnit === 'hours' ? '0.5' : '5'}
					min="0"
					bind:value={timeSinceDrinking}
					placeholder={timeUnit === 'hours' ? 'e.g. 1.5' : 'e.g. 90'}
					class="pr-20"
				/>
				<button
					type="button"
					onclick={toggleTimeUnit}
					class="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-1"
				>
					{timeUnit}
				</button>
			</div>
		</div>
	</div>

	<!-- Drink Selection -->
	<div class="space-y-3">
		<Label class="flex items-center gap-2">
			<Martini class="h-4 w-4 text-muted-foreground" />
			Drinks Consumed
		</Label>

		<!-- Autocomplete Search -->
		<div class="relative">
			<div class="relative">
				<Search
					class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
				/>
				<Input
					type="text"
					placeholder="Search cocktails or add beer, wine, shots..."
					bind:value={searchQuery}
					onfocus={handleSearchFocus}
					onblur={handleSearchBlur}
					class="pl-9"
				/>
			</div>

			<!-- Dropdown -->
			{#if showDropdown}
				<div
					class="absolute w-full max-h-64 overflow-y-auto z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md"
				>
					<!-- Generic Drinks Section -->
					{#if filteredGenericDrinks.length > 0}
						<div class="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
							Standard Drinks
						</div>
						{#each filteredGenericDrinks as drink}
							<button
								type="button"
								class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center gap-2"
								onmousedown={() => addDrink(drink.id, true)}
							>
								<drink.icon class="h-4 w-4 text-muted-foreground" />
								<span class="flex-1">{drink.name}</span>
								<span class="text-xs text-muted-foreground">{drink.abv}% ABV</span>
							</button>
						{/each}
					{/if}

					<!-- Catalog Cocktails Section -->
					{#if filteredRecipes.length > 0}
						<div class="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
							Your Cocktails
						</div>
						{#each filteredRecipes.slice(0, 10) as recipe}
							<button
								type="button"
								class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center gap-2"
								onmousedown={() => addDrink(recipe.recipe.recipeId, false)}
							>
								<Martini class="h-4 w-4 text-muted-foreground" />
								<span class="flex-1">{recipe.recipe.recipeName || 'Unnamed Recipe'}</span>
								<span class="text-xs text-muted-foreground">{getRecipeAbv(recipe)}</span>
							</button>
						{/each}
						{#if filteredRecipes.length > 10}
							<div class="px-3 py-2 text-xs text-muted-foreground">
								...and {filteredRecipes.length - 10} more. Type to filter.
							</div>
						{/if}
					{/if}

					{#if filteredGenericDrinks.length === 0 && filteredRecipes.length === 0}
						<div class="px-3 py-2 text-sm text-muted-foreground">No results found</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Selected Drinks List -->
		{#if selectedDrinks.length > 0}
			<div class="space-y-2 pt-2">
				{#each selectedDrinks as drink}
					{#if drink.isGeneric}
						{@const genericDrink = getGenericDrinkById(drink.recipeId as string)}
						{#if genericDrink}
							<div
								class="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
							>
								<div class="flex items-center gap-2">
									<genericDrink.icon class="h-4 w-4 text-muted-foreground" />
									<div>
										<span class="font-medium">{genericDrink.name}</span>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<Button
										variant="outline"
										size="icon"
										class="h-8 w-8"
										onclick={() => removeDrink(drink.recipeId, true)}
									>
										<Minus class="h-4 w-4" />
									</Button>
									<span class="w-8 text-center font-bold">{drink.quantity}</span>
									<Button
										variant="outline"
										size="icon"
										class="h-8 w-8"
										onclick={() => incrementDrink(drink.recipeId, true)}
									>
										<Plus class="h-4 w-4" />
									</Button>
								</div>
							</div>
						{/if}
					{:else}
						{@const recipe = getRecipeById(drink.recipeId as number)}
						{#if recipe}
							<div
								class="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
							>
								<div class="flex items-center gap-2">
									<Martini class="h-4 w-4 text-muted-foreground" />
									<div>
										<span class="font-medium">{recipe.recipe.recipeName}</span>
										<span class="text-xs text-muted-foreground ml-2">{getRecipeAbv(recipe)}</span>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<Button
										variant="outline"
										size="icon"
										class="h-8 w-8"
										onclick={() => removeDrink(drink.recipeId, false)}
									>
										<Minus class="h-4 w-4" />
									</Button>
									<span class="w-8 text-center font-bold">{drink.quantity}</span>
									<Button
										variant="outline"
										size="icon"
										class="h-8 w-8"
										onclick={() => incrementDrink(drink.recipeId, false)}
									>
										<Plus class="h-4 w-4" />
									</Button>
								</div>
							</div>
						{/if}
					{/if}
				{/each}
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">
				Search above to add cocktails from your catalog, or add standard drinks like beer, wine, or
				shots.
			</p>
		{/if}
	</div>

	<!-- Calculate Button -->
	<Button onclick={calculate} class="w-full sm:w-auto" disabled={selectedDrinks.length === 0}>
		<Calculator class="h-4 w-4 mr-2" />
		Calculate BAC
	</Button>

	<!-- Results Section -->
	{#if hasCalculated}
		<div class="pt-4 border-t space-y-4">
			<!-- BAC Result -->
			<div
				class="p-6 rounded-lg border {colorClasses[impairment.color]} flex flex-col items-center text-center"
			>
				<p class="text-sm font-medium uppercase tracking-wide opacity-75">
					Estimated Blood Alcohol Content
				</p>
				<p class="text-5xl font-bold mt-2">{bacResult.toFixed(3)}%</p>
				<p class="text-lg font-semibold mt-2">{impairment.level}</p>
				<p class="text-sm opacity-75 mt-1">{impairment.description}</p>
			</div>

			<!-- Time Until Sober -->
			{#if bacResult > 0}
				<div class="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
					<Clock class="h-5 w-5 text-blue-500 shrink-0" />
					<div class="flex-1">
						<p class="text-xs text-muted-foreground">Estimated Time Until Sober</p>
						<p class="text-lg font-bold">
							{timeUntilSober.toFixed(1)}
							<span class="text-sm font-normal text-muted-foreground">hours</span>
						</p>
					</div>
				</div>
			{/if}

			<!-- Warnings -->
			{#if bacResult >= 0.05 && bacResult < 0.08}
				<Alert.Root class="border-yellow-500/50 bg-yellow-500/10">
					<TriangleAlert class="h-4 w-4 text-yellow-600" />
					<Alert.Title class="text-yellow-600">Approaching Legal Limit</Alert.Title>
					<Alert.Description class="text-sm text-yellow-600/90">
						You are approaching the legal driving limit in most jurisdictions. Consider stopping and
						waiting before driving.
					</Alert.Description>
				</Alert.Root>
			{/if}

			{#if bacResult >= 0.08}
				<Alert.Root variant="destructive" class="border-rose-500/50 bg-rose-500/10">
					<TriangleAlert class="h-4 w-4" />
					<Alert.Title>Above Legal Limit</Alert.Title>
					<Alert.Description class="text-sm">
						Your estimated BAC is at or above the legal driving limit (0.08%) in most U.S. states. Do
						not drive. Use a designated driver or rideshare service.
					</Alert.Description>
				</Alert.Root>
			{/if}
		</div>
	{/if}

	<!-- Instructions hint -->
	{#if !hasCalculated}
		<div class="p-4 rounded-lg bg-muted/30 border border-dashed">
			<p class="text-sm text-muted-foreground">
				<strong>How to use:</strong> Enter your body weight, select your biological sex for the Widmark
				factor, specify how long ago you started drinking, add the cocktails you've consumed with quantities,
				and click calculate.
			</p>
		</div>
	{/if}
</div>
