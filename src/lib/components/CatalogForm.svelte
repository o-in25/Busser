<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Helper } from '$lib/components/ui/helper';
	import * as Dialog from '$lib/components/ui/dialog';
	import type {
		ComponentAction,
		PreparationMethod,
		Spirit,
		View,
	} from '$lib/types';
	import FileUpload from './FileUpload.svelte';
	import CatalogFormItem from './CatalogFormItem.svelte';
	import { v4 as uuidv4 } from 'uuid';
	import { Plus, ThumbsUp, Trash2 } from 'lucide-svelte';
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
	export let spirits: Spirit[];
	export let preparationMethods: PreparationMethod[];
	export let recipe: View.BasicRecipe = {} as View.BasicRecipe;
	export let recipeSteps: View.BasicRecipeStep[] = [];
	const permissions: string[] = getContext('permissions') || [];

	// recipe model
	recipeSteps = recipeSteps.map(step => ({
		...step,
		productIdQuantityInMilliliters: convertFromMl(
			step.productIdQuantityUnit,
			step.productIdQuantityInMilliliters
		),
		key: uuidv4(),
	}));
	const createStep = () => ({
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

	let steps = recipeSteps.length ? recipeSteps : [createStep()];

	const addStep = () => {
		steps = [...steps, createStep()];
	};

	const removeStep = (stepNumber: number) => {
		if (steps.length > 0) {
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
		} else {
			$notificationStore.error = { message: result.error };
		}
	};

	// form props
	let [defaultPrepMethodChoice] = preparationMethods;
	let [defaultSpirit] = spirits;
	let defaultSpiritChoice =
		recipe.recipeCategoryId || defaultSpirit.recipeCategoryId;
	let prepMethodChoice =
		recipe.recipeTechniqueDescriptionId ||
		defaultPrepMethodChoice.recipeTechniqueDescriptionId;

	$: prepMethodDilutionPct =
		defaultPrepMethodChoice.recipeTechniqueDilutionPercentage;

	let disabled = false;
	let modalOpen = false;
</script>

<div class="px-4 p-4 mt-3 glass-surface">
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
					goto(result.location);
				} else {
					await applyAction(result);
					disabled = false;
					if (result.type === 'failure')
						$notificationStore.error = {
							message: result?.data?.error?.toString() || '',
						};
					if (result.type === 'success')
						$notificationStore.success = { message: 'Catalog updated.' };
				}
			};
		}}
	>
		<fieldset>
			<div class="flex items-center justify-between">
				<legend class="mb-3">
					<h6 class="text-lg font-semibold">Details</h6>
				</legend>
			</div>

			<!-- name -->
			<div class="grid gap-6 grid-cols-1 mb-6">
				<div>
					<Label for="productName" class="mb-2">
						Name
					</Label>
					<Input
						type="text"
						id="recipeName"
						name="recipeName"
						bind:value={recipe.recipeName}
						required
					/>
				</div>
			</div>

			<!-- category -->
			<div class="mb-6">
				<Label for="recipeCategoryId" class="mb-2">
					Category
				</Label>
				<div
					class="grid gap-6 w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6"
				>
					{#each spirits as spirit}
						<label class="w-full cursor-pointer">
							<input
								type="radio"
								name="recipeCategoryId"
								value={spirit.recipeCategoryId}
								bind:group={defaultSpiritChoice}
								class="sr-only peer"
							/>
							<div
								class="p-1 inline-flex justify-between items-center text-muted-foreground bg-background rounded-lg border border-input cursor-pointer peer-checked:border-primary peer-checked:text-primary hover:bg-accent transition-colors"
							>
								<div class="block">
									<div class="h-auto max-w-16 md:max-w-20 rounded">
										<img
											src={spirit.recipeCategoryDescriptionImageUrl}
											alt={spirit.recipeCategoryDescription}
											class="object-contain rounded"
										/>
									</div>
								</div>
								<div class="w-20 text-center p-0.5">
									<div class="w-full text-sm md:text-md font-semibold truncate">
										{spirit.recipeCategoryDescription}
									</div>
								</div>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<!-- description -->
			<div class="mb-6">
				<Prompt
					bind:value={recipe.recipeDescription}
					trigger={recipe.recipeName}
					id="recipeDescription"
					name="recipeDescription"
					url="/api/generator/inventory"
				/>
			</div>

			<!-- served -->
			<div class="mb-6">
				<Label for="recipeTechniqueDescriptionId" class="mb-2">
					Served
				</Label>
				<div class="flex flex-wrap gap-1 rounded-md shadow-sm">
					{#each preparationMethods as prepMethod, i}
						<label class="flex-1">
							<input
								type="radio"
								name="recipeTechniqueDescriptionId"
								value={prepMethod.recipeTechniqueDescriptionId}
								bind:group={prepMethodChoice}
								class="sr-only peer"
								onclick={() =>
									(prepMethodDilutionPct =
										prepMethod.recipeTechniqueDilutionPercentage)}
							/>
							<div
								class={cn(
									"w-full py-2 px-4 text-center text-sm font-medium border cursor-pointer transition-colors",
									"peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary",
									"hover:bg-accent",
									i === 0 && "rounded-l-md",
									i === preparationMethods.length - 1 && "rounded-r-md"
								)}
							>
								{prepMethod.recipeTechniqueDescriptionText}
							</div>
						</label>
					{/each}
				</div>
				<Helper class="ps-1 py-1">
					Adds {prepMethodDilutionPct}% dilution by water.
				</Helper>
			</div>

			<!-- image -->
			<div class="mb-6">
				<FileUpload
					name="recipeImageUrl"
					signedUrl={recipe.recipeImageUrl || undefined}
				></FileUpload>
			</div>
		</fieldset>

		<!-- rating -->
		<fieldset>
			<Label for="productName" class="mb-2">
				Ratings
			</Label>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="mt-4">
					<Label for="recipeSweetnessRating" class="mb-2">
						Sweetness
					</Label>
					<input
						bind:value={recipe.recipeSweetnessRating}
						type="range"
						id="recipeSweetnessRating"
						name="recipeSweetnessRating"
						min="0"
						max="10"
						step="0.1"
						class="w-full bg-muted rounded-lg appearance-none cursor-pointer h-3"
					/>
				</div>
				<div class="mt-4">
					<Label for="recipeDrynessRating" class="mb-2">
						Dryness
					</Label>
					<input
						bind:value={recipe.recipeDrynessRating}
						type="range"
						id="recipeDrynessRating"
						name="recipeDrynessRating"
						min="0"
						max="10"
						step="0.1"
						class="w-full bg-muted rounded-lg appearance-none cursor-pointer h-3"
					/>
				</div>
				<div class="mt-4">
					<Label for="recipeVersatilityRating" class="mb-2">
						Versatility
					</Label>
					<input
						bind:value={recipe.recipeVersatilityRating}
						type="range"
						id="recipeVersatilityRating"
						name="recipeVersatilityRating"
						min="0"
						max="10"
						step="0.1"
						class="w-full bg-muted rounded-lg appearance-none cursor-pointer h-3"
					/>
				</div>
				<div class="mt-4">
					<Label for="recipeStrengthRating" class="mb-2">
						Strength
					</Label>
					<input
						bind:value={recipe.recipeStrengthRating}
						type="range"
						id="recipeStrengthRating"
						name="recipeStrengthRating"
						min="0"
						max="10"
						step="0.1"
						class="w-full bg-muted rounded-lg appearance-none cursor-pointer h-3"
					/>
				</div>
			</div>
		</fieldset>

		<Separator class="my-4" />

		<!-- inner form -->
		<fieldset class="px-1 md:py-2">
			<legend class="mb-2">
				<h6 class="text-lg font-semibold">Steps</h6>
			</legend>
			{#each steps as step, stepNumber (step.key)}
				<div
					class="py-4"
					transition:scale={{
						duration: 250,
						delay: 0,
						opacity: 0.5,
						start: 0,
						easing: quintOut,
					}}
				>
					<CatalogFormItem
						{step}
						{stepNumber}
						clickHandler={removeStep}
					/>
				</div>
			{/each}

			<div class="my-4 flex flex-row justify-center">
				<Button
					class="rounded-full"
					onclick={addStep}
					variant="outline"
				>
					<Plus class="w-6 h-6" />
					<span class="hidden lg:block pe-2">Add Another Step</span>
				</Button>
			</div>
		</fieldset>

		<div class="md:flex justify-end">
			<!-- submit -->
			<div class="my-4 md:mr-4">
				{#if recipe.recipeId && permissions.includes('delete_catalog')}
					<Button
						class="w-full md:w-32"
						type="button"
						variant="destructive"
						onclick={() => (modalOpen = true)}
					>
						Delete
					</Button>
				{/if}
			</div>
			<!-- delete -->
			<div class="my-4 md:mr-4 order-2">
				<Button
					class="w-full md:w-32"
					type="submit"
					{disabled}
				>
					Save
				</Button>
			</div>
		</div>
	</form>
	{#if recipe.recipeId}
		<Dialog.Root bind:open={modalOpen}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Confirm Delete</Dialog.Title>
					<Dialog.Description>
						Delete <span class="font-semibold">{recipe?.recipeName}</span> from catalog?
						<p class="text-red-600 dark:text-red-400 font-bold mt-2">
							Once deleted, it can't be recovered.
						</p>
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button
						variant="destructive"
						onclick={async () => {
							await deleteRecipe();
							modalOpen = false;
						}}
					>
						Delete
					</Button>
					<Button variant="outline" onclick={() => (modalOpen = false)}>Cancel</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>

<style lang="scss">
	textarea {
		resize: none;
	}
</style>
