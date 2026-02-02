<script lang="ts">
	import { GripVertical, X } from 'lucide-svelte';

	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { QuickSelect } from '$lib/components/ui/quick-select';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
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
		step.baseSpiritId = item.baseSpiritId ?? null;
		// Also set stepCategoryId for category-based matching
		step.stepCategoryId = item.categoryId ?? null;
		// Reset match mode to default when changing products
		matchMode = 'EXACT_PRODUCT';
	}

	// Match mode selection
	let matchMode: MatchMode = $state(step.matchMode || 'EXACT_PRODUCT');
	$effect(() => {
		step.matchMode = matchMode;
		// When using category/spirit matching, store the categoryId
		if (matchMode !== 'EXACT_PRODUCT' && step.categoryId === undefined) {
			step.categoryId = step.categoryId ?? null;
		}
	});

	// Determine if base spirit matching is available (only for spirit categories)
	let hasBaseSpirit = $derived(step.baseSpiritId !== null && step.baseSpiritId !== undefined);

	// Get display names for the match mode options
	let categoryDisplayName = $derived(step.categoryName || 'this category');
	let baseSpiritDisplayName = $derived.by(() => {
		// Map baseSpiritId to spirit name
		const spiritNames: Record<number, string> = {
			4: 'Whiskey',
			5: 'Gin',
			6: 'Vodka',
			7: 'Tequila',
			8: 'Rum',
			9: 'Brandy',
		};
		return step.baseSpiritId ? spiritNames[step.baseSpiritId] || 'this spirit' : 'this spirit';
	});

	// unit selection with local state for proper reactivity
	let selectedUnit = $state(step.productIdQuantityUnit || 'oz');
	$effect(() => {
		step.productIdQuantityUnit = selectedUnit;
		// always set to 4 oz equivalent when "top off" is selected
		if (selectedUnit === 'top off') {
			step.productIdQuantityInMilliliters = 4;
		}
	});

	let isTopOff = $derived(selectedUnit === 'top off');

	// all available units
	const units = ['oz', 'ml', 'dash', 'tsp', 'tbsp', 'cube', 'top off'];

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
		tbsp: [
			{ label: '0.5', value: '0.5' },
			{ label: '1', value: '1' },
			{ label: '2', value: '2' },
		],
		cube: [
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
			<div>
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
					<RadioGroup.Root bind:value={matchMode} class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<RadioGroup.Item value="EXACT_PRODUCT" id={`match-exact-${stepNumber}`} />
							<Label for={`match-exact-${stepNumber}`} class="text-sm font-normal cursor-pointer">
								This exact product only
							</Label>
						</div>
						<div class="flex items-center gap-2">
							<RadioGroup.Item value="ANY_IN_CATEGORY" id={`match-category-${stepNumber}`} />
							<Label
								for={`match-category-${stepNumber}`}
								class="text-sm font-normal cursor-pointer"
							>
								Any <span class="font-medium">{categoryDisplayName}</span>
							</Label>
						</div>
						{#if hasBaseSpirit}
							<div class="flex items-center gap-2">
								<RadioGroup.Item value="ANY_IN_BASE_SPIRIT" id={`match-spirit-${stepNumber}`} />
								<Label
									for={`match-spirit-${stepNumber}`}
									class="text-sm font-normal cursor-pointer"
								>
									Any <span class="font-medium">{baseSpiritDisplayName}</span>
								</Label>
							</div>
						{/if}
					</RadioGroup.Root>
					<p class="text-xs text-muted-foreground">
						{#if matchMode === 'EXACT_PRODUCT'}
							Recipe requires this specific product to be in stock.
						{:else if matchMode === 'ANY_IN_CATEGORY'}
							Recipe can use any {categoryDisplayName} from your inventory.
						{:else}
							Recipe can use any {baseSpiritDisplayName} from your inventory.
						{/if}
					</p>
				</div>
			{/if}

			<!-- Amount section -->
			<div class="space-y-2">
				<Label class="text-sm">Amount</Label>

				<!-- Quantity + Unit inputs -->
				<div class="flex gap-2">
					<Input
						name="productIdQuantityInMilliliters"
						type="number"
						class="flex-1"
						placeholder="0"
						value={String(step.productIdQuantityInMilliliters)}
						oninput={(e) =>
							(step.productIdQuantityInMilliliters = parseFloat(e.currentTarget.value) || 0)}
						step="0.25"
						min="0"
						disabled={isTopOff}
					/>
					<Select.Root type="single" bind:value={selectedUnit}>
						<Select.Trigger class="w-24">
							{selectedUnit}
						</Select.Trigger>
						<Select.Content>
							{#each units as unit}
								<Select.Item value={unit} label={unit} />
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Quick select for current unit -->
				{#if quickOptions.length > 0}
					<QuickSelect options={quickOptions} onselect={handleQuickSelect} class="mt-2" />
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
