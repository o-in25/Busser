<script lang="ts">
	import { GripVertical, X } from 'lucide-svelte';

	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { QuickSelect } from '$lib/components/ui/quick-select';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { View } from '$lib/types';
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
				/>
			</div>

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
