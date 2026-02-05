<script lang="ts">
	import {
		ArrowUpDown,
		BookOpen,
		Candy,
		Droplet,
		FlaskConical,
		Gauge,
		Image,
		Plus,
		Sparkles,
		Wand2,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { v4 as uuidv4 } from 'uuid';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { CollapsibleSection } from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { FlavorSlider } from '$lib/components/ui/flavor-slider';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { ServingMethodToggle } from '$lib/components/ui/serving-method';
	import { SpiritCard } from '$lib/components/ui/spirit-card';
	import { calculateOverallScore, convertFromMl, convertToMl } from '$lib/math';
	import type { PreparationMethod, Spirit, View } from '$lib/types';

	import { notificationStore } from '../../stores';
	import CatalogFormWizard from './CatalogFormWizard.svelte';
	import CocktailMetrics from './CocktailMetrics.svelte';
	import FormDraftManager from './FormDraftManager.svelte';
	import ImagePrompt from './ImagePrompt.svelte';
	import Prompt from './Prompt.svelte';
	import RecipeStepCard from './RecipeStepCard.svelte';

	// props
	let {
		spirits,
		preparationMethods,
		recipe: initialRecipe = {} as View.BasicRecipe,
		recipeSteps: initialRecipeSteps = [],
	}: {
		spirits: Spirit[];
		preparationMethods: PreparationMethod[];
		recipe?: View.BasicRecipe;
		recipeSteps?: View.BasicRecipeStep[];
	} = $props();

	// Make recipe deeply reactive for two-way binding on properties
	let recipe = $state(initialRecipe);

	// get workspace role for permission checks
	const workspace = getContext<{ workspaceRole?: string }>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// Determine if this is add mode (for draft functionality)
	const isAddMode = !recipe.recipeId;

	// Process recipe steps reactively
	const processedSteps = $derived(
		initialRecipeSteps.map((step) => ({
			...step,
			productIdQuantityInMilliliters: convertFromMl(
				step.productIdQuantityUnit,
				step.productIdQuantityInMilliliters
			),
			id: uuidv4(),
		}))
	);

	const createStep = (): View.BasicRecipeStep & { id: string } => ({
		recipeId: recipe.recipeId || 0,
		recipeStepId: 0,
		productId: 0,
		categoryId: 0,
		stepCategoryId: null,
		matchMode: 'EXACT_PRODUCT',
		parentCategoryId: null,
		parentCategoryName: null,
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
		id: uuidv4(),
	});

	let steps: (View.BasicRecipeStep & { id: string })[] = $state([]);
	$effect.pre(() => {
		if (processedSteps.length && steps.length === 0) {
			steps = [...processedSteps];
		} else if (steps.length === 0) {
			steps = [createStep()];
		}
	});

	const addStep = () => {
		steps = [...steps, createStep()];
	};

	const removeStep = (stepNumber: number) => {
		if (Array.isArray(steps) && steps.length > 1) {
			const newSteps = [...steps];
			newSteps.splice(stepNumber, 1);
			steps = newSteps;
		}
	};

	// base spirit categories for auto-reorder sorting
	const baseSpirits = new Set([
		'whiskey',
		'bourbon',
		'rye',
		'scotch',
		'vodka',
		'gin',
		'rum',
		'tequila',
		'mezcal',
		'brandy',
		'cognac',
		'armagnac',
	]);

	const isBaseSpirit = (categoryName: string) =>
		baseSpirits.has(categoryName.toLowerCase().trim());

	const isTopOff = (step: View.BasicRecipeStep) => step.productIdQuantityUnit === 'top off';

	// auto-reorder: cheapest first, base spirits second-to-last, top-off last
	const autoReorderSteps = () => {
		const topOffSteps: typeof steps = [];
		const spiritSteps: typeof steps = [];
		const otherSteps: typeof steps = [];

		for (const step of steps) {
			if (isTopOff(step)) {
				topOffSteps.push(step);
			} else if (isBaseSpirit(step.categoryName)) {
				spiritSteps.push(step);
			} else {
				otherSteps.push(step);
			}
		}

		// sort each group by price (cheapest first)
		const byPrice = (a: View.BasicRecipeStep, b: View.BasicRecipeStep) =>
			a.productPricePerUnit - b.productPricePerUnit;

		otherSteps.sort(byPrice);
		spiritSteps.sort(byPrice);
		topOffSteps.sort(byPrice);

		steps = [...otherSteps, ...spiritSteps, ...topOffSteps];
	};

	// preserve width, lock horizontal position, and scale down when dragging
	function transformDraggedElement(el: HTMLElement | undefined) {
		if (!el) return;
		const container = el.parentElement;
		if (!container) return;

		const containerRect = container.getBoundingClientRect();
		el.style.width = `${containerRect.width}px`;
		el.style.left = `${containerRect.left}px`;
		el.style.transform = 'scale(0.33)';
		el.style.opacity = '0.9';
		el.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
	}

	// dnd config (cast to any to avoid incomplete type defs)
	const getDndOptions = (items: typeof steps, disabled: boolean) =>
		({
			items,
			flipDurationMs: 200,
			transformDraggedElement,
			dragHandleSelector: '.drag-handle',
			dropTargetStyle: {},
			dragDisabled: disabled,
		}) as any;

	// minimal dnd handlers
	type StepWithId = View.BasicRecipeStep & { id: string };
	function handleDndConsider(e: CustomEvent<DndEvent<StepWithId>>) {
		steps = e.detail.items as StepWithId[];
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<StepWithId>>) {
		steps = e.detail.items as StepWithId[];
	}

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

	// form props - these are $state because they can be modified by user selection or draft restore
	let selectedSpiritId: number | undefined = $state(undefined);
	let selectedPrepMethodId: number | undefined = $state(undefined);
	$effect.pre(() => {
		if (selectedSpiritId === undefined) {
			selectedSpiritId = recipe.recipeCategoryId || spirits[0]?.recipeCategoryId;
		}
		if (selectedPrepMethodId === undefined) {
			selectedPrepMethodId =
				recipe.recipeTechniqueDescriptionId || preparationMethods[0]?.recipeTechniqueDescriptionId;
		}
	});

	// Ratings state
	let sweetnessRating = $state(recipe.recipeSweetnessRating || 5);
	let drynessRating = $state(recipe.recipeDrynessRating || 5);
	let versatilityRating = $state(recipe.recipeVersatilityRating || 5);
	let strengthRating = $state(recipe.recipeStrengthRating || 5);
	let ratingsGenerating = $state(false);

	// Calculate preview score based on current ratings
	const previewScore = $derived(
		calculateOverallScore(versatilityRating, sweetnessRating, drynessRating, strengthRating)
	);

	// Rating label and color based on score
	const ratingsMap = [
		{ max: 0, label: 'No Rating', bg: 'bg-gray-500' },
		{ max: 2, label: 'Needs Work', bg: 'bg-red-500' },
		{ max: 4, label: 'Below Average', bg: 'bg-orange-500' },
		{ max: 5, label: 'Average', bg: 'bg-yellow-500' },
		{ max: 6, label: 'Good', bg: 'bg-lime-500' },
		{ max: 7, label: 'Great', bg: 'bg-green-500' },
		{ max: 8, label: 'Excellent', bg: 'bg-emerald-500' },
		{ max: 10, label: 'Outstanding', bg: 'bg-teal-500' },
	];

	const scoreLabel = $derived(
		ratingsMap.find((r) => previewScore <= r.max) || ratingsMap[ratingsMap.length - 1]
	);

	// Generate ratings with AI
	async function generateRatings() {
		if (!recipe.recipeName || steps.length === 0) {
			$notificationStore.error = { message: 'Please add a recipe name and at least one ingredient first.' };
			return;
		}

		ratingsGenerating = true;
		try {
			const response = await fetch('/api/generator/rating', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					recipeName: recipe.recipeName,
					recipeDescription: recipe.recipeDescription,
					ingredients: steps.map((step) => ({
						name: step.productName || step.categoryName,
						quantity: step.productIdQuantityInMilliliters,
						unit: step.productIdQuantityUnit,
						proof: step.productProof,
					})),
				}),
			});

			if (!response.ok) throw new Error('Failed to generate ratings');

			const data = await response.json();
			sweetnessRating = data.sweetnessRating;
			drynessRating = data.drynessRating;
			versatilityRating = data.versatilityRating;
			strengthRating = data.strengthRating;
		} catch (error) {
			console.error('Failed to generate ratings:', error);
		} finally {
			ratingsGenerating = false;
		}
	}

	// Derive visual context for image generation
	const imageIngredients = $derived(
		steps
			.filter((s) => s.productName || s.categoryName)
			.map((s) => s.productName || s.categoryName)
	);
	const imageTechnique = $derived(
		preparationMethods.find((m) => m.recipeTechniqueDescriptionId === selectedPrepMethodId)
			?.recipeTechniqueDescriptionText || ''
	);

	// Pending image state (held in memory until form save)
	let pendingImageFile = $state<File | null>(null);
	let imageCleared = $state(false);

	// Collapsible state - closed by default in add mode
	let descriptionOpen = $state(!isAddMode);
	let ratingsOpen = $state(!isAddMode);

	// Form state
	let disabled = $state(false);
	let modalOpen = $state(false);
	let wizardStep = $state(0);
	let reorderMode = $state(false);

	// Validation state
	let touched = $state({ recipeName: false });
	const errors = $derived({
		recipeName: !recipe.recipeName?.trim() ? 'Recipe name is required' : '',
		ingredients: !steps.some((s) => s.productId > 0 || s.stepCategoryId)
			? 'At least one ingredient is required'
			: '',
	});

	// Step-based validation for wizard
	const stepValid = $derived({
		0: !!recipe.recipeName?.trim(), // name required
		1: true, // description optional
		2: steps.some((s) => s.productId > 0 || s.stepCategoryId), // at least one ingredient
		3: true, // prep method has default
		4: true, // ratings optional
	});
	const canProceedWizard = $derived(stepValid[wizardStep as keyof typeof stepValid] ?? true);
	const isFormValid = $derived(stepValid[0] && stepValid[2]);

	// Draft manager reference
	let draftManager = $state<FormDraftManager>();

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
		if (data.recipeTechniqueDescriptionId)
			selectedPrepMethodId = data.recipeTechniqueDescriptionId as number;
		if (data.recipeSweetnessRating) sweetnessRating = data.recipeSweetnessRating as number;
		if (data.recipeDrynessRating) drynessRating = data.recipeDrynessRating as number;
		if (data.recipeVersatilityRating) versatilityRating = data.recipeVersatilityRating as number;
		if (data.recipeStrengthRating) strengthRating = data.recipeStrengthRating as number;
		if (data.steps) steps = data.steps as (View.BasicRecipeStep & { id: string })[];
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

<div class="px-2 sm:px-4 py-4 mt-3">
	<form
		class="relative"
		method="POST"
		enctype="multipart/form-data"
		use:enhance={async ({ formData }) => {
			disabled = true;

			// Upload pending image if any (held in memory until now)
			if (pendingImageFile) {
				const uploadData = new FormData();
				uploadData.append('file', pendingImageFile);
				const res = await fetch('/api/upload/image', { method: 'POST', body: uploadData });
				const data = await res.json();
				if (data.url) {
					formData.set('recipeImageUrl', data.url);
				}
			} else if (imageCleared) {
				formData.set('recipeImageCleared', 'true');
			}

			let json = steps.map((step) => ({
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
					$notificationStore.success = { message: 'Catalog updated.' };
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
		<!-- Mobile delete section (shown above wizard in edit mode) -->
		{#if recipe.recipeId && canModify}
			<div class="md:hidden mb-6 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
				<p class="text-sm text-muted-foreground mb-3">Danger Zone</p>
				<Button
					type="button"
					variant="destructive"
					class="w-full"
					onclick={() => (modalOpen = true)}
				>
					Delete Recipe
				</Button>
			</div>
		{/if}

		<!-- Mobile wizard view -->
		<CatalogFormWizard bind:currentStep={wizardStep} canProceed={canProceedWizard}>
			{#snippet children({ step })}
				{#if step === 0}
					<!-- Step 1: Details (Name + Spirit Category) -->
					<div class="space-y-6">
						<div>
							<Label for="recipeName" class="mb-2">
								Name <span class="text-destructive">*</span>
							</Label>
							<Input
								type="text"
								id="recipeName"
								name="recipeName"
								placeholder="e.g., Old Fashioned"
								bind:value={recipe.recipeName}
								onblur={() => (touched.recipeName = true)}
								class={touched.recipeName && errors.recipeName ? 'border-destructive' : ''}
								required
							/>
							{#if touched.recipeName && errors.recipeName}
								<Helper color="red">{errors.recipeName}</Helper>
							{/if}
						</div>

						<div>
							<Label class="mb-3 text-base font-medium block">Spirit Category</Label>
							<input type="hidden" name="recipeCategoryId" value={selectedSpiritId} />
							<div class="grid grid-cols-2 gap-3">
								{#each spirits as spirit}
									<SpiritCard
										{spirit}
										selected={spirit.recipeCategoryId === selectedSpiritId}
										onselect={(s) => (selectedSpiritId = s.recipeCategoryId)}
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
								url="/api/generator/recipe"
							/>
						</div>
						<div>
							<ImagePrompt
								name="recipeImageUrl"
								bind:signedUrl={recipe.recipeImageUrl}
								bind:pendingFile={pendingImageFile}
								bind:imageCleared
								trigger={recipe.recipeName}
								ingredients={imageIngredients}
								technique={imageTechnique}
							/>
						</div>
					</div>
				{:else if step === 2}
					<!-- Step 3: Ingredients -->
					<div class="space-y-4">
						{#if errors.ingredients}
							<Helper color="red">{errors.ingredients}</Helper>
						{/if}
						<CocktailMetrics {steps} recipeTechniqueDescriptionId={selectedPrepMethodId} />
						<div class="flex gap-2">
							<Button
								type="button"
								variant={reorderMode ? 'default' : 'outline'}
								size="sm"
								class="flex-1"
								onclick={() => (reorderMode = !reorderMode)}
							>
								<ArrowUpDown class="w-4 h-4 mr-2" />
								{reorderMode ? 'Done' : 'Reorder'}
							</Button>
							{#if reorderMode}
								<Button
									type="button"
									variant="outline"
									size="sm"
									class="flex-1"
									onclick={autoReorderSteps}
								>
									<Wand2 class="w-4 h-4 mr-2" />
									Auto
								</Button>
							{/if}
						</div>

						<div
							use:dndzone={getDndOptions(steps, !reorderMode)}
							onconsider={handleDndConsider as any}
							onfinalize={handleDndFinalize as any}
							class="space-y-4"
						>
							{#each steps as step, stepNumber (step.id)}
								<div animate:flip={{ duration: 200 }}>
									<RecipeStepCard
										bind:step={steps[stepNumber]}
										{stepNumber}
										onremove={removeStep}
										canRemove={steps.length > 1}
										{reorderMode}
									/>
								</div>
							{/each}
						</div>

						<Button type="button" variant="outline" class="w-full" onclick={addStep}>
							<Plus class="w-4 h-4 mr-2" />
							Add Ingredient
						</Button>
					</div>
				{:else if step === 3}
					<!-- Step 4: Preparation Method -->
					<div class="space-y-4">
						<Label class="text-base font-medium block">How is it served?</Label>
						<ServingMethodToggle
							methods={preparationMethods}
							bind:value={selectedPrepMethodId}
							variant="cards"
							{steps}
						/>
					</div>
				{:else if step === 4}
					<!-- Step 5: Flavor Ratings -->
					<div class="space-y-6">
						<!-- Score Preview -->
						<div class="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
							<span class="text-sm text-muted-foreground">Overall Score</span>
							<div class="flex items-center gap-2">
								<span class={`px-2 py-0.5 rounded text-xs font-medium text-white ${scoreLabel.bg}`}>
									{scoreLabel.label}
								</span>
								<span class="text-lg font-bold tabular-nums">{previewScore.toFixed(1)}</span>
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							class="w-full"
							onclick={generateRatings}
							disabled={ratingsGenerating}
						>
							<Wand2 class="w-4 h-4 mr-2" />
							{ratingsGenerating ? 'Generating...' : 'Generate with AI'}
						</Button>
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
						<Label for="recipeName" class="mb-2">
							Name <span class="text-destructive">*</span>
						</Label>
						<Input
							type="text"
							id="recipeName"
							name="recipeName"
							placeholder="e.g., Old Fashioned"
							bind:value={recipe.recipeName}
							onblur={() => (touched.recipeName = true)}
							class={touched.recipeName && errors.recipeName ? 'border-destructive' : ''}
							required
						/>
						{#if touched.recipeName && errors.recipeName}
							<Helper color="red">{errors.recipeName}</Helper>
						{/if}
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
									onselect={(s) => (selectedSpiritId = s.recipeCategoryId)}
								/>
							{/each}
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Section 2: Description (collapsible) -->
			<CollapsibleSection title="Description" icon={Image} bind:open={descriptionOpen}>
				<div class="space-y-6">
					<Prompt
						bind:value={recipe.recipeDescription}
						trigger={recipe.recipeName}
						id="recipeDescription"
						name="recipeDescription"
						url="/api/generator/catalog"
					/>
					<ImagePrompt
						name="recipeImageUrl"
						bind:signedUrl={recipe.recipeImageUrl}
						bind:pendingFile={pendingImageFile}
						bind:imageCleared
						trigger={recipe.recipeName}
						ingredients={imageIngredients}
						technique={imageTechnique}
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
					<ServingMethodToggle methods={preparationMethods} bind:value={selectedPrepMethodId} />
				</Card.Content>
			</Card.Root>

			<!-- Section 4: Flavor Profile (collapsible) -->
			<CollapsibleSection title="Flavor Profile" icon={Gauge} bind:open={ratingsOpen}>
				<div class="space-y-4">
					<!-- Score Preview -->
					<div class="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
						<span class="text-sm text-muted-foreground">Overall Score</span>
						<div class="flex items-center gap-2">
							<span class={`px-2 py-0.5 rounded text-xs font-medium text-white ${scoreLabel.bg}`}>
								{scoreLabel.label}
							</span>
							<span class="text-lg font-bold tabular-nums">{previewScore.toFixed(1)}</span>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						onclick={generateRatings}
						disabled={ratingsGenerating}
					>
						<Wand2 class="w-4 h-4 mr-2" />
						{ratingsGenerating ? 'Generating...' : 'Generate with AI'}
					</Button>
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
				</div>
			</CollapsibleSection>

			<!-- Section 5: Ingredients (not collapsible) -->
			<Card.Root>
				<Card.Header class="pb-4">
					<Card.Title class="flex items-center gap-2 text-lg">
						<FlaskConical class="h-5 w-5 text-primary" />
						Ingredients
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#if errors.ingredients}
						<Helper color="red">{errors.ingredients}</Helper>
					{/if}

					<!-- Metrics display -->
					<CocktailMetrics {steps} recipeTechniqueDescriptionId={selectedPrepMethodId} />

					<!-- Reorder toggle -->
					<div class="flex gap-2">
						<Button
							type="button"
							variant={reorderMode ? 'default' : 'outline'}
							size="sm"
							onclick={() => (reorderMode = !reorderMode)}
						>
							<ArrowUpDown class="w-4 h-4 mr-2" />
							{reorderMode ? 'Done' : 'Reorder'}
						</Button>
						{#if reorderMode}
							<Button type="button" variant="outline" size="sm" onclick={autoReorderSteps}>
								<Wand2 class="w-4 h-4 mr-2" />
								Auto-Reorder
							</Button>
						{/if}
					</div>

					<!-- Recipe steps -->
					<div
						use:dndzone={getDndOptions(steps, !reorderMode)}
						onconsider={handleDndConsider as any}
						onfinalize={handleDndFinalize as any}
						class="space-y-4"
					>
						{#each steps as step, stepNumber (step.id)}
							<div animate:flip={{ duration: 200 }}>
								<RecipeStepCard
									bind:step={steps[stepNumber]}
									{stepNumber}
									onremove={removeStep}
									canRemove={steps.length > 1}
									{reorderMode}
								/>
							</div>
						{/each}
					</div>

					<!-- Add step button -->
					<div class="flex justify-center pt-2">
						<Button type="button" variant="outline" class="rounded-full" onclick={addStep}>
							<Plus class="w-5 h-5 mr-2" />
							Add Ingredient
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Action buttons (desktop only) -->
			<div class="flex justify-end gap-3">
				{#if recipe.recipeId && canModify}
					<Button type="button" variant="destructive" onclick={() => (modalOpen = true)}>
						Delete
					</Button>
				{/if}
				<Button type="submit" disabled={disabled || !isFormValid}>Save Recipe</Button>
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
						<p class="text-destructive font-bold mt-2">Once deleted, it can't be recovered.</p>
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

<style>
	/* placeholder shown where dragged item will be inserted */
	:global([data-is-dnd-shadow-item-hint]) {
		opacity: 0.4;
		border-top: 3px solid hsl(var(--primary));
		margin-top: -2px;
	}
</style>