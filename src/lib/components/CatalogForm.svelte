<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { SpiritCard } from '$lib/components/ui/spirit-card';
	import { ServingMethodToggle } from '$lib/components/ui/serving-method';
	import { FlavorSlider } from '$lib/components/ui/flavor-slider';
	import { CollapsibleSection } from '$lib/components/ui/collapsible';
	import type {
		PreparationMethod,
		Spirit,
		View,
	} from '$lib/types';
	import FileUpload from './FileUpload.svelte';
	import RecipeStepCard from './RecipeStepCard.svelte';
	import CocktailMetrics from './CocktailMetrics.svelte';
	import CatalogFormWizard from './CatalogFormWizard.svelte';
	import FormDraftManager from './FormDraftManager.svelte';
	import { v4 as uuidv4 } from 'uuid';
	import { Plus, Candy, Droplet, Sparkles, Gauge, BookOpen, Image, FlaskConical } from 'lucide-svelte';
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { quintOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import { notificationStore } from '../../stores';
	import Prompt from './Prompt.svelte';
	import { convertFromMl, convertToMl } from '$lib/math';
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';

	// props
	let {
		spirits,
		preparationMethods,
		recipe = $bindable({} as View.BasicRecipe),
		recipeSteps: initialRecipeSteps = [],
	}: {
		spirits: Spirit[];
		preparationMethods: PreparationMethod[];
		recipe?: View.BasicRecipe;
		recipeSteps?: View.BasicRecipeStep[];
	} = $props();

	const permissions: string[] = getContext('permissions') || [];

	// Determine if this is add mode (for draft functionality)
	const isAddMode = !recipe.recipeId;

	// Process recipe steps on init
	const processedSteps = initialRecipeSteps.map(step => ({
		...step,
		productIdQuantityInMilliliters: convertFromMl(
			step.productIdQuantityUnit,
			step.productIdQuantityInMilliliters
		),
		key: uuidv4(),
	}));

	const createStep = (): View.BasicRecipeStep & { key: string } => ({
		recipeId: recipe.recipeId || 0,
		recipeStepId: 0,
		productId: 0,
		recipeStepDescription: '',
		productName: '',
		categoryName: '',
		categoryDescription: null,
		supplierName: '',
		supplierDetails: null,
		productIdQuantityInMilliliters: 0,
		productIdQuantityUnit: 'ml',
		productInStockQuantity: 0,
		productPricePerUnit: 0,
		productUnitSizeInMilliliters: 0,
		productProof: 0,
		key: uuidv4(),
	});

	let steps = $state(processedSteps.length ? processedSteps : [createStep()]);

	const addStep = () => {
		steps = [...steps, createStep()];
	};

	const removeStep = (stepNumber: number) => {
		if (steps.length > 1) {
			steps.splice(stepNumber, 1);
			steps = steps;
		}
	};

	const deleteRecipe = async () => {
		const response = await fetch(`/api/catalog/${recipe.recipeId}`, {
			method: 'DELETE',
		});

		const result = await response.json();
		if ('data' in result) {
			$notificationStore.success = { message: 'Catalog item deleted.' };
			goto('/catalog');
		} else {
			$notificationStore.error = { message: result.error };
		}
	};

	// form props
	let [defaultPrepMethod] = preparationMethods;
	let [defaultSpirit] = spirits;

	let selectedSpiritId = $state(recipe.recipeCategoryId || defaultSpirit.recipeCategoryId);
	let selectedPrepMethodId = $state(recipe.recipeTechniqueDescriptionId || defaultPrepMethod.recipeTechniqueDescriptionId);

	// Ratings state
	let sweetnessRating = $state(recipe.recipeSweetnessRating || 5);
	let drynessRating = $state(recipe.recipeDrynessRating || 5);
	let versatilityRating = $state(recipe.recipeVersatilityRating || 5);
	let strengthRating = $state(recipe.recipeStrengthRating || 5);

	// Collapsible state - closed by default in add mode
	let descriptionOpen = $state(!isAddMode);
	let ratingsOpen = $state(!isAddMode);

	// Form state
	let disabled = $state(false);
	let modalOpen = $state(false);
	let wizardStep = $state(0);

	// Draft manager reference
	let draftManager: FormDraftManager;

	// Draft data for autosave
	let draftData = $derived({
		recipeName: recipe.recipeName,
		recipeDescription: recipe.recipeDescription,
		recipeCategoryId: selectedSpiritId,
		recipeTechniqueDescriptionId: selectedPrepMethodId,
		recipeSweetnessRating: sweetnessRating,
		recipeDrynessRating: drynessRating,
		recipeVersatilityRating: versatilityRating,
		recipeStrengthRating: strengthRating,
		steps: steps,
	});

	// Restore draft handler
	function handleRestoreDraft(data: Record<string, unknown>) {
		if (data.recipeName) recipe.recipeName = data.recipeName as string;
		if (data.recipeDescription) recipe.recipeDescription = data.recipeDescription as string;
		if (data.recipeCategoryId) selectedSpiritId = data.recipeCategoryId as number;
		if (data.recipeTechniqueDescriptionId) selectedPrepMethodId = data.recipeTechniqueDescriptionId as number;
		if (data.recipeSweetnessRating) sweetnessRating = data.recipeSweetnessRating as number;
		if (data.recipeDrynessRating) drynessRating = data.recipeDrynessRating as number;
		if (data.recipeVersatilityRating) versatilityRating = data.recipeVersatilityRating as number;
		if (data.recipeStrengthRating) strengthRating = data.recipeStrengthRating as number;
		if (data.steps) steps = data.steps as (View.BasicRecipeStep & { key: string })[];
	}
</script>

<!-- Draft manager (add mode only) -->
{#if isAddMode}
	<FormDraftManager
		bind:this={draftManager}
		draftKey="catalog-form"
		data={draftData}
		onrestore={handleRestoreDraft}
	/>
{/if}

<div class="px-4 py-4 mt-3">
	<form
		class="relative"
		method="POST"
		enctype="multipart/form-data"
		use:enhance={({ formData }) => {
			disabled = true;
			let json = steps.map(step => ({
				...step,
				productIdQuantityInMilliliters: convertToMl(
					step.productIdQuantityUnit,
					step.productIdQuantityInMilliliters
				),
			}));
			formData.append('recipeSteps', JSON.stringify(json));
			return async ({ result }) => {
				if (result.type === 'redirect') {
					// Clear draft on successful submit
					if (isAddMode && draftManager) {
						draftManager.clearDraft();
					}
					goto(result.location);
				} else {
					await applyAction(result);
					disabled = false;
					if (result.type === 'failure')
						$notificationStore.error = {
							message: result?.data?.error?.toString() || '',
						};
					if (result.type === 'success') {
						$notificationStore.success = { message: 'Catalog updated.' };
						if (isAddMode && draftManager) {
							draftManager.clearDraft();
						}
					}
				}
			};
		}}
	>
		<!-- Mobile wizard view -->
		<CatalogFormWizard bind:currentStep={wizardStep}>
			{#snippet children({ step, isActive })}
				{#if step === 0}
					<!-- Step 1: Details (Name + Spirit Category) -->
					<div class="space-y-6">
						<div>
							<Label for="recipeName" class="mb-2 text-base font-medium">Recipe Name</Label>
							<Input
								type="text"
								id="recipeName"
								name="recipeName"
								placeholder="e.g., Old Fashioned"
								bind:value={recipe.recipeName}
								required
								class="text-lg"
							/>
						</div>

						<div>
							<Label class="mb-3 text-base font-medium block">Spirit Category</Label>
							<input type="hidden" name="recipeCategoryId" value={selectedSpiritId} />
							<div class="grid grid-cols-2 gap-3">
								{#each spirits as spirit}
									<SpiritCard
										{spirit}
										selected={spirit.recipeCategoryId === selectedSpiritId}
										onselect={(s) => selectedSpiritId = s.recipeCategoryId}
									/>
								{/each}
							</div>
						</div>
					</div>
				{:else if step === 1}
					<!-- Step 2: Description + Image -->
					<div class="space-y-6">
						<div>
							<Prompt
								bind:value={recipe.recipeDescription}
								trigger={recipe.recipeName}
								id="recipeDescription"
								name="recipeDescription"
								url="/api/generator/catalog"
							/>
						</div>
						<div>
							<FileUpload
								name="recipeImageUrl"
								signedUrl={recipe.recipeImageUrl || undefined}
							/>
						</div>
					</div>
				{:else if step === 2}
					<!-- Step 3: Preparation Method -->
					<div class="space-y-4">
						<Label class="text-base font-medium block">How is it served?</Label>
						<ServingMethodToggle
							methods={preparationMethods}
							bind:value={selectedPrepMethodId}
						/>
					</div>
				{:else if step === 3}
					<!-- Step 4: Flavor Ratings -->
					<div class="space-y-6">
						<FlavorSlider
							label="Sweetness"
							name="recipeSweetnessRating"
							bind:value={sweetnessRating}
							icon={Candy}
							color="pink"
						/>
						<FlavorSlider
							label="Dryness"
							name="recipeDrynessRating"
							bind:value={drynessRating}
							icon={Droplet}
							color="amber"
						/>
						<FlavorSlider
							label="Versatility"
							name="recipeVersatilityRating"
							bind:value={versatilityRating}
							icon={Sparkles}
							color="purple"
						/>
						<FlavorSlider
							label="Strength"
							name="recipeStrengthRating"
							bind:value={strengthRating}
							icon={Gauge}
							color="orange"
						/>
					</div>
				{:else if step === 4}
					<!-- Step 5: Ingredients -->
					<div class="space-y-4">
						<CocktailMetrics
							{steps}
							recipeTechniqueDescriptionId={selectedPrepMethodId}
						/>
						{#each steps as step, stepNumber (step.key)}
							<div
								transition:scale={{
									duration: 250,
									delay: 0,
									opacity: 0.5,
									start: 0,
									easing: quintOut,
								}}
							>
								<RecipeStepCard
									bind:step={steps[stepNumber]}
									{stepNumber}
									onremove={removeStep}
									canRemove={steps.length > 1}
								/>
							</div>
						{/each}
						<Button
							type="button"
							variant="outline"
							class="w-full"
							onclick={addStep}
						>
							<Plus class="w-4 h-4 mr-2" />
							Add Ingredient
						</Button>
					</div>
				{/if}
			{/snippet}
		</CatalogFormWizard>

		<!-- Desktop view (all sections visible) -->
		<div class="hidden md:block space-y-6">
			<!-- Section 1: Recipe Details (not collapsible) -->
			<Card.Root>
				<Card.Header class="pb-4">
					<Card.Title class="flex items-center gap-2 text-lg">
						<BookOpen class="h-5 w-5 text-primary" />
						Recipe Details
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-6">
					<!-- Name -->
					<div>
						<Label for="recipeName" class="mb-2">Name</Label>
						<Input
							type="text"
							id="recipeName"
							name="recipeName"
							placeholder="e.g., Old Fashioned"
							bind:value={recipe.recipeName}
							required
						/>
					</div>

					<!-- Spirit Category -->
					<div>
						<Label class="mb-3 block">Spirit Category</Label>
						<input type="hidden" name="recipeCategoryId" value={selectedSpiritId} />
						<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
							{#each spirits as spirit}
								<SpiritCard
									{spirit}
									selected={spirit.recipeCategoryId === selectedSpiritId}
									onselect={(s) => selectedSpiritId = s.recipeCategoryId}
								/>
							{/each}
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Section 2: Description (collapsible) -->
			<CollapsibleSection
				title="Description"
				icon={Image}
				bind:open={descriptionOpen}
			>
				<div class="space-y-6">
					<Prompt
						bind:value={recipe.recipeDescription}
						trigger={recipe.recipeName}
						id="recipeDescription"
						name="recipeDescription"
						url="/api/generator/catalog"
					/>
					<FileUpload
						name="recipeImageUrl"
						signedUrl={recipe.recipeImageUrl || undefined}
					/>
				</div>
			</CollapsibleSection>

			<!-- Section 3: Preparation Method (not collapsible) -->
			<Card.Root>
				<Card.Header class="pb-4">
					<Card.Title class="flex items-center gap-2 text-lg">
						<FlaskConical class="h-5 w-5 text-primary" />
						Preparation Method
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<ServingMethodToggle
						methods={preparationMethods}
						bind:value={selectedPrepMethodId}
					/>
				</Card.Content>
			</Card.Root>

			<!-- Section 4: Flavor Profile (collapsible) -->
			<CollapsibleSection
				title="Flavor Profile"
				icon={Gauge}
				bind:open={ratingsOpen}
			>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FlavorSlider
						label="Sweetness"
						name="recipeSweetnessRating"
						bind:value={sweetnessRating}
						icon={Candy}
						color="pink"
					/>
					<FlavorSlider
						label="Dryness"
						name="recipeDrynessRating"
						bind:value={drynessRating}
						icon={Droplet}
						color="amber"
					/>
					<FlavorSlider
						label="Versatility"
						name="recipeVersatilityRating"
						bind:value={versatilityRating}
						icon={Sparkles}
						color="purple"
					/>
					<FlavorSlider
						label="Strength"
						name="recipeStrengthRating"
						bind:value={strengthRating}
						icon={Gauge}
						color="orange"
					/>
				</div>
			</CollapsibleSection>

			<!-- Section 5: Ingredients (not collapsible) -->
			<Card.Root>
				<Card.Header class="pb-4">
					<div class="flex items-center justify-between">
						<Card.Title class="flex items-center gap-2 text-lg">
							<FlaskConical class="h-5 w-5 text-primary" />
							Ingredients
						</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Metrics display -->
					<CocktailMetrics
						{steps}
						recipeTechniqueDescriptionId={selectedPrepMethodId}
					/>

					<!-- Recipe steps -->
					{#each steps as step, stepNumber (step.key)}
						<div
							transition:scale={{
								duration: 250,
								delay: 0,
								opacity: 0.5,
								start: 0,
								easing: quintOut,
							}}
						>
							<RecipeStepCard
								bind:step={steps[stepNumber]}
								{stepNumber}
								onremove={removeStep}
								canRemove={steps.length > 1}
							/>
						</div>
					{/each}

					<!-- Add step button -->
					<div class="flex justify-center pt-2">
						<Button
							type="button"
							variant="outline"
							class="rounded-full"
							onclick={addStep}
						>
							<Plus class="w-5 h-5 mr-2" />
							Add Ingredient
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Action buttons (desktop only) -->
			<div class="flex justify-end gap-3">
				{#if recipe.recipeId && permissions.includes('delete_catalog')}
					<Button
						type="button"
						variant="destructive"
						onclick={() => (modalOpen = true)}
					>
						Delete
					</Button>
				{/if}
				<Button type="submit" {disabled}>
					Save Recipe
				</Button>
			</div>
		</div>
	</form>

	<!-- Delete confirmation dialog -->
	{#if recipe.recipeId}
		<Dialog.Root bind:open={modalOpen}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Confirm Delete</Dialog.Title>
					<Dialog.Description>
						Delete <span class="font-semibold">{recipe?.recipeName}</span> from catalog?
						<p class="text-destructive font-bold mt-2">
							Once deleted, it can't be recovered.
						</p>
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (modalOpen = false)}>Cancel</Button>
					<Button
						variant="destructive"
						onclick={async () => {
							await deleteRecipe();
							modalOpen = false;
						}}
					>
						Delete
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>
