<script lang="ts">
	import {
		ArrowUpDown,
		BookOpen,
		Candy,
		Droplet,
		FlaskConical,
		Gauge,
		Image,
		Martini,
		Plus,
		Sparkles,
	} from 'lucide-svelte';
	import { setContext } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { v4 as uuidv4 } from 'uuid';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { FormShell } from '$lib/components/form';
	import NestedFormSheet from '$lib/components/form/NestedFormSheet.svelte';
	import { FlavorSlider } from '$lib/components/ui/flavor-slider';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { ServingMethodToggle } from '$lib/components/ui/serving-method';
	import { SpiritCard } from '$lib/components/ui/spirit-card';
	import { Switch } from '$lib/components/ui/switch';
	import { calculateOverallScore, convertFromMl, convertToMl } from '$lib/math';
	import { NESTED_FORM_KEY, NestedFormStack } from './form/NestedForm.svelte';
	import type { PreparationMethod, Spirit, View } from '$lib/types';

	import { notificationStore } from '../../stores';
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
	// svelte-ignore state_referenced_locally
	let recipe = $state(initialRecipe);

	// provide the nested-form stack so any SearchableSelect "+" can open a stacked sheet
	const nestedStack = new NestedFormStack();
	setContext(NESTED_FORM_KEY, nestedStack);

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

	const isBaseSpirit = (categoryName: string) => baseSpirits.has(categoryName.toLowerCase().trim());

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
			dropTargetStyle: {},
			dragDisabled: disabled,
		}) as any;

	type StepWithId = View.BasicRecipeStep & { id: string };
	function handleDndConsider(e: CustomEvent<DndEvent<StepWithId>>) {
		steps = e.detail.items as StepWithId[];
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<StepWithId>>) {
		steps = e.detail.items as StepWithId[];
	}

	// form props - $state because they can be modified by user selection or draft restore
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

	const previewScore = $derived(
		calculateOverallScore(versatilityRating, sweetnessRating, drynessRating, strengthRating)
	);

	const ratingsMap = [
		{ max: 0, label: 'No Rating', bg: 'bg-gray-500' },
		{ max: 2, label: 'Needs Work', bg: 'bg-red-500' },
		{ max: 4, label: 'Below Average', bg: 'bg-neon-amber-500' },
		{ max: 5, label: 'Average', bg: 'bg-neon-yellow-500' },
		{ max: 6, label: 'Good', bg: 'bg-lime-500' },
		{ max: 7, label: 'Great', bg: 'bg-neon-green-500' },
		{ max: 8, label: 'Excellent', bg: 'bg-emerald-500' },
		{ max: 10, label: 'Outstanding', bg: 'bg-teal-500' },
	];

	const scoreLabel = $derived(
		ratingsMap.find((r) => previewScore <= r.max) || ratingsMap[ratingsMap.length - 1]
	);

	async function generateRatings() {
		if (!recipe.recipeName || steps.length === 0) {
			$notificationStore.error = {
				message: 'Please add a recipe name and at least one ingredient first.',
			};
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
		steps.filter((s) => s.productName || s.categoryName).map((s) => s.productName || s.categoryName)
	);
	const imageTechnique = $derived(
		preparationMethods.find((m) => m.recipeTechniqueDescriptionId === selectedPrepMethodId)
			?.recipeTechniqueDescriptionText || ''
	);

	// Pending image state (held in memory until form save)
	let pendingImageFile = $state<File | null>(null);
	let imageCleared = $state(false);

	// AI insights toggle
	// svelte-ignore state_referenced_locally
	let insightsEnabled = $state(initialRecipe.insightsEnabled ?? true);

	// Form state
	let disabled = $state(false);
	let currentStep = $state(0);
	let reorderMode = $state(false);

	// Validation state
	let touched = $state({ recipeName: false });
	const errors = $derived({
		recipeName: !recipe.recipeName?.trim() ? 'Recipe name is required' : '',
		ingredients: !steps.some((s) => s.productId > 0 || s.stepCategoryId)
			? 'At least one ingredient is required'
			: '',
	});

	// Step-based validation
	const stepValid = $derived({
		0: !!recipe.recipeName?.trim(), // name required
		1: true, // description optional
		2: steps.some((s) => s.productId > 0 || s.stepCategoryId), // at least one ingredient
		3: true, // ratings optional
		4: true, // prep method has default
	});
	const canProceed = $derived(stepValid[currentStep as keyof typeof stepValid] ?? true);
	const isFormValid = $derived(stepValid[0] && stepValid[2]);

	// step config for the shell
	const formSteps = [
		{ title: 'Details', icon: BookOpen },
		{ title: 'Description', icon: Image, optional: true },
		{ title: 'Ingredients', icon: FlaskConical },
		{ title: 'Preparation', icon: Martini },
		{ title: 'Ratings', icon: Gauge, optional: true },
	];

	// Draft manager + last-saved timestamp (drives the autosave pill in the shell footer)
	let draftManager = $state<FormDraftManager>();
	let draftLastSaved = $state<Date | null>(null);

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

<div class="px-2 pb-4 pt-1 sm:px-4 md:mt-3 md:py-4">
	<form
		class="relative"
		method="POST"
		enctype="multipart/form-data"
		use:enhance={async ({ formData }) => {
			disabled = true;

			// scalar fields are serialized from state so submission works from any step
			formData.set('recipeName', recipe.recipeName ?? '');
			formData.set('recipeCategoryId', String(selectedSpiritId ?? ''));
			formData.set('recipeDescription', recipe.recipeDescription ?? '');
			formData.set('recipeTechniqueDescriptionId', String(selectedPrepMethodId ?? ''));
			formData.set('recipeSweetnessRating', String(sweetnessRating));
			formData.set('recipeDrynessRating', String(drynessRating));
			formData.set('recipeStrengthRating', String(strengthRating));
			formData.set('recipeVersatilityRating', String(versatilityRating));
			formData.set('insightsEnabled', String(insightsEnabled));

			// resolve the image: new upload, cleared, or keep existing
			if (pendingImageFile) {
				const uploadData = new FormData();
				uploadData.append('file', pendingImageFile);
				uploadData.append('kind', 'recipes');
				const res = await fetch('/api/upload/image', { method: 'POST', body: uploadData });
				const data = await res.json();
				if (data.url) {
					formData.set('recipeImageUrl', data.url);
				}
			} else if (imageCleared) {
				formData.set('recipeImageCleared', 'true');
			} else if (recipe.recipeImageUrl) {
				formData.set('recipeImageUrl', recipe.recipeImageUrl);
			}

			let json = steps.map((step) => ({
				...step,
				productIdQuantityInMilliliters: convertToMl(
					step.productIdQuantityUnit,
					step.productIdQuantityInMilliliters
				),
			}));
			formData.set('recipeSteps', JSON.stringify(json));

			return async ({ result }) => {
				if (result.type === 'redirect') {
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
		<FormShell
			steps={formSteps}
			bind:currentStep
			{canProceed}
			isValid={isFormValid}
			submitting={disabled}
			lastSaved={draftLastSaved}
			cancelHref="/catalog"
			eyebrow="New Recipe"
			submitLabel="Save Recipe"
		>
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
							<Label class="mb-3 block text-base font-medium">Spirit Category</Label>
							<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
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
						<Prompt
							bind:value={recipe.recipeDescription}
							trigger={recipe.recipeName}
							id="recipeDescription"
							name="recipeDescription"
							url="/api/generator/recipe"
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
								disabled={steps.length < 2}
								onclick={() => (reorderMode = !reorderMode)}
							>
								<ArrowUpDown class="mr-2 h-4 w-4" />
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
									<Sparkles class="mr-2 h-4 w-4" />
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

						<div class="flex justify-center pt-1">
							<Button type="button" variant="outline" class="rounded-full" onclick={addStep}>
								<Plus class="mr-2 h-5 w-5" />
								Add Ingredient
							</Button>
						</div>
					</div>
				{:else if step === 3}
					<!-- Step 4: Preparation Method -->
					<div class="space-y-4">
						<Label class="block text-base font-medium">How is it served?</Label>
						<ServingMethodToggle
							methods={preparationMethods}
							bind:value={selectedPrepMethodId}
							variant="cards"
							{steps}
						/>
						<CocktailMetrics {steps} recipeTechniqueDescriptionId={selectedPrepMethodId} />
					</div>
				{:else if step === 4}
					<!-- Step 5: Flavor Ratings -->
					<div class="space-y-6">
						<div class="glass-surface flex items-center justify-between rounded-xl p-3">
							<span class="text-sm text-muted-foreground">Overall Score</span>
							<div class="flex items-center gap-2">
								<span class={`rounded px-2 py-0.5 text-xs font-medium text-white ${scoreLabel.bg}`}>
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
							<Sparkles class="mr-2 h-4 w-4" />
							{ratingsGenerating ? 'Generating...' : 'Auto-Generate'}
						</Button>
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
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

						<!-- AI Insights toggle -->
						<div class="glass-surface flex items-center justify-between rounded-xl p-3">
							<div class="space-y-0.5">
								<Label class="flex items-center gap-1.5 text-sm font-medium">
									<Sparkles class="h-4 w-4 text-primary" />
									Insights
								</Label>
								<p class="text-xs text-muted-foreground">
									Auto-generate generate cocktail history, tips, and pairings for this recipe.
								</p>
							</div>
							<Switch bind:checked={insightsEnabled} />
						</div>
					</div>
				{/if}
			{/snippet}
		</FormShell>
	</form>
</div>

<!-- Draft manager (add mode only) -->
{#if isAddMode}
	<FormDraftManager
		bind:this={draftManager}
		bind:lastSaved={draftLastSaved}
		draftKey="catalog-form"
		data={draftData}
		onrestore={handleRestoreDraft}
	/>
{/if}

<!-- Nested product/category creation sheets -->
<NestedFormSheet />

<style>
	/* placeholder shown where dragged item will be inserted */
	:global([data-is-dnd-shadow-item-hint]) {
		opacity: 0.4;
		border-top: 3px solid hsl(var(--primary));
		margin-top: -2px;
	}
</style>
