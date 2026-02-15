<script lang="ts">
	import { GripVertical, X } from 'lucide-svelte';

	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { QuickSelect } from '$lib/components/ui/quick-select';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		convertFromMl,
		convertToMl,
		getUnitLabel,
		getUnitOptions,
		topOffPresets,
	} from '$lib/math';
	import type { MatchMode, SelectOption, View } from '$lib/types';
	import { cn } from '$lib/utils';

	import Autocomplete from './Autocomplete.svelte';

	let {
		class: className,
		step = $bindable<View.BasicRecipeStep>(),
		stepNumber,
		onremove,
		canRemove = true,
		reorderMode = false,
		...restProps
	}: {
		class?: string;
		step: View.BasicRecipeStep;
		stepNumber: number;
		onremove?: (stepNumber: number) => void;
		canRemove?: boolean;
		reorderMode?: boolean;
		[key: string]: unknown;
	} = $props();

	// Convert productId to/from string for Autocomplete
	let productIdValue: string | null = $state(step.productId ? String(step.productId) : null);

	$effect(() => {
		step.productId = productIdValue ? parseInt(productIdValue, 10) : 0;
	});

	// Handle product selection - populate category info for match mode selector
	function handleProductSelect(item: SelectOption) {
		step.productName = item.name;
		step.categoryId = item.categoryId ?? 0;
		step.categoryName = item.categoryName ?? '';
		step.parentCategoryId = item.parentCategoryId ?? null;
		step.parentCategoryName = item.parentCategoryName ?? null;
		// Also set stepCategoryId for category-based matching
		step.stepCategoryId = item.categoryId ?? null;
		// Reset match mode to default when changing products
		matchMode = 'EXACT_PRODUCT';
	}

	// Match mode selection
	let matchMode: MatchMode = $state(step.matchMode || 'EXACT_PRODUCT');
	$effect(() => {
		step.matchMode = matchMode;
	});

	// Determine if flexible matching options are available
	// Only show match mode selector for categories that have a parent (i.e., are part of a hierarchy)
	let hasParentCategory = $derived(
		step.parentCategoryId !== null && step.parentCategoryId !== undefined
	);

	// Reset to EXACT_PRODUCT if parent category mode was selected but no parent exists
	$effect(() => {
		if (!hasParentCategory && matchMode === 'ANY_IN_PARENT_CATEGORY') {
			matchMode = 'EXACT_PRODUCT';
		}
	});

	// Get display names for the match mode options
	let categoryDisplayName = $derived(step.categoryName || 'this category');
	let parentCategoryDisplayName = $derived(step.parentCategoryName || 'this category');

	// unit selection with local state for proper reactivity
	let selectedUnit = $state(step.productIdQuantityUnit || 'oz');
	let previousUnit = $state(step.productIdQuantityUnit || 'oz');

	// convert quantity when unit changes
	function handleUnitChange(newUnit: string) {
		if (newUnit === previousUnit) return;

		const currentValue = step.productIdQuantityInMilliliters;

		// convert current display value to ml, then to new unit
		if (newUnit === 'top off') {
			// switching to top off - set default preset
			if (!topOffPresets.some((p) => p.ml === currentValue)) {
				step.productIdQuantityInMilliliters = 90;
			}
		} else if (previousUnit === 'top off') {
			// switching from top off - convert ml value to new unit
			step.productIdQuantityInMilliliters = convertFromMl(newUnit, currentValue);
		} else {
			// normal unit to unit conversion
			const mlValue = convertToMl(previousUnit, currentValue);
			step.productIdQuantityInMilliliters = convertFromMl(newUnit, mlValue);
		}

		previousUnit = newUnit;
		selectedUnit = newUnit;
		step.productIdQuantityUnit = newUnit;
	}

	let isTopOff = $derived(selectedUnit === 'top off');
	let selectedPreset = $derived(
		topOffPresets.find((p) => p.ml === step.productIdQuantityInMilliliters)?.ml || 90
	);

	// all available units with display labels
	const unitOptions = getUnitOptions();
	let selectedUnitLabel = $derived(getUnitLabel(selectedUnit));

	// quick select options per unit
	const quickOptionsByUnit: Record<string, { label: string; value: string }[]> = {
		oz: [
			{ label: '0.25', value: '0.25' },
			{ label: '0.5', value: '0.5' },
			{ label: '0.75', value: '0.75' },
			{ label: '1', value: '1' },
			{ label: '1.5', value: '1.5' },
			{ label: '2', value: '2' },
		],
		ml: [
			{ label: '15', value: '15' },
			{ label: '22.5', value: '22.5' },
			{ label: '30', value: '30' },
			{ label: '45', value: '45' },
			{ label: '60', value: '60' },
		],
		dash: [
			{ label: '1', value: '1' },
			{ label: '2', value: '2' },
			{ label: '3', value: '3' },
		],
		tsp: [
			{ label: '0.5', value: '0.5' },
			{ label: '1', value: '1' },
			{ label: '2', value: '2' },
		],
		barspoon: [
			{ label: '1', value: '1' },
			{ label: '2', value: '2' },
			{ label: '3', value: '3' },
		],
		tbsp: [
			{ label: '0.5', value: '0.5' },
			{ label: '1', value: '1' },
			{ label: '2', value: '2' },
		],
		cube: [
			{ label: '1', value: '1' },
			{ label: '2', value: '2' },
		],
		'egg white': [
			{ label: '1', value: '1' },
			{ label: '2', value: '2' },
		],
		'egg yolk': [
			{ label: '1', value: '1' },
			{ label: '2', value: '2' },
		],
		'whole egg': [
			{ label: '1', value: '1' },
			{ label: '2', value: '2' },
		],
	};

	// get quick options for currently selected unit
	let quickOptions = $derived(quickOptionsByUnit[selectedUnit] || []);

	function handleQuickSelect(val: string | number) {
		step.productIdQuantityInMilliliters = parseFloat(String(val));
	}

	let descriptionLength = $derived(step.recipeStepDescription?.length || 0);
	const maxDescription = 200;
</script>

<Card.Root class={cn('relative group', reorderMode && 'flex', className)} {...restProps}>
	{#if reorderMode}
		<!-- drag handle - touch here to drag -->
		<div
			class="drag-handle flex-shrink-0 w-10 flex items-center justify-center border-r border-border/50 cursor-grab active:cursor-grabbing touch-none"
		>
			<GripVertical class="h-5 w-5 text-muted-foreground" />
		</div>
	{/if}

	<div class="flex-1 min-w-0">
		<Card.Header class="pb-3">
			<div class="flex items-center justify-between">
				<Card.Title class="flex items-center gap-2 text-base">
					<span
						class="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold"
					>
						{stepNumber + 1}
					</span>
					Ingredient
				</Card.Title>

				<!-- Remove button -->
				{#if canRemove}
					<button
						type="button"
						class="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
						onclick={() => onremove?.(stepNumber)}
					>
						<X class="w-4 h-4" />
					</button>
				{/if}
			</div>
		</Card.Header>

		<Card.Content class="space-y-4">
			<!-- Product name autocomplete -->
			<div class="space-y-2">
				<Autocomplete
					label="Item from Inventory"
					placeholder="Search for an ingredient..."
					name="productId"
					fetchUrl="/api/select/products"
					bind:value={productIdValue}
					key={step.productName}
					onselect={handleProductSelect}
				/>
			</div>

			<!-- Match mode selector -->
			{#if step.productId}
				<div class="space-y-2">
					<Label class="text-sm">Ingredient Matching</Label>
					<RadioGroup.Root bind:value={matchMode} class="gap-0.5">
						<RadioGroup.Item value="EXACT_PRODUCT" class="px-2 py-1.5 text-xs"
							>Exact</RadioGroup.Item
						>
						<RadioGroup.Item value="ANY_IN_CATEGORY" class="px-2 py-1.5 text-xs truncate"
							>Any {categoryDisplayName}</RadioGroup.Item
						>
						{#if hasParentCategory}
							<RadioGroup.Item value="ANY_IN_PARENT_CATEGORY" class="px-2 py-1.5 text-xs truncate"
								>Any {parentCategoryDisplayName}</RadioGroup.Item
							>
						{/if}
					</RadioGroup.Root>
					<p class="text-xs text-muted-foreground">
						{#if matchMode === 'EXACT_PRODUCT'}
							Recipe requires this specific product to be in stock.
						{:else if matchMode === 'ANY_IN_CATEGORY'}
							Recipe can use any {categoryDisplayName} from your inventory.
						{:else}
							Recipe can use any {parentCategoryDisplayName} from your inventory.
						{/if}
					</p>
				</div>
			{/if}

			<!-- Amount section -->
			<div class="space-y-2">
				<Label class="text-sm">Amount</Label>

				{#if isTopOff}
					<!-- Preset selector for top off -->
					<div class="space-y-2">
						<Select.Root type="single" value={selectedUnit} onValueChange={handleUnitChange}>
							<Select.Trigger class="w-full">
								{selectedUnitLabel}
							</Select.Trigger>
							<Select.Content>
								{#each unitOptions as unit}
									<Select.Item value={unit.value} label={unit.label} />
								{/each}
							</Select.Content>
						</Select.Root>
						<div class="grid grid-cols-2 gap-2">
							{#each topOffPresets as preset}
								<button
									type="button"
									class={cn(
										'px-3 py-2 text-sm rounded-lg border transition-colors',
										selectedPreset === preset.ml
											? 'bg-primary text-primary-foreground border-primary'
											: 'bg-background hover:bg-muted border-input'
									)}
									onclick={() => (step.productIdQuantityInMilliliters = preset.ml)}
								>
									{preset.label}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<!-- Quantity + Unit inputs -->
					<div class="flex gap-2">
						<Input
							type="number"
							class="flex-1"
							placeholder="0"
							value={String(step.productIdQuantityInMilliliters)}
							oninput={(e) =>
								(step.productIdQuantityInMilliliters = parseFloat(e.currentTarget.value) || 0)}
							step="0.25"
							min="0"
						/>
						<Select.Root type="single" value={selectedUnit} onValueChange={handleUnitChange}>
							<Select.Trigger class="w-32">
								{selectedUnitLabel}
							</Select.Trigger>
							<Select.Content>
								{#each unitOptions as unit}
									<Select.Item value={unit.value} label={unit.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Quick select for current unit -->
					{#if quickOptions.length > 0}
						<QuickSelect options={quickOptions} onselect={handleQuickSelect} class="mt-2" />
					{/if}
				{/if}
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for={`step-desc-${stepNumber}`} class="text-sm">Notes</Label>
					<span
						class={cn(
							'text-xs',
							descriptionLength > maxDescription ? 'text-destructive' : 'text-muted-foreground'
						)}
					>
						{descriptionLength}/{maxDescription}
					</span>
				</div>
				<Textarea
					id={`step-desc-${stepNumber}`}
					rows={2}
					placeholder="Optional notes about this ingredient..."
					bind:value={step.recipeStepDescription}
					class="resize-none"
				/>
			</div>
		</Card.Content>
	</div>
</Card.Root>
