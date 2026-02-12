<script lang="ts">
	import Autocomplete from '$lib/components/Autocomplete.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import type { PreparationMethod } from '$lib/types';
	let {
		open = $bindable(false),
		preparationMethods = [],
		filters = {},
		onsearch,
	}: {
		open?: boolean;
		preparationMethods?: PreparationMethod[];
		filters?: Record<string, string | number>;
		onsearch?: (params: Record<string, string>) => void;
	} = $props();

	// local state for each filter
	let readyToMake = $state(false);
	let ingredientValue = $state<string | null>(null);
	let ingredientLabel = $state('');
	let strengthMin = $state(0);
	let strengthMax = $state(10);
	let ingredientCountMin = $state(0);
	let ingredientCountMax = $state(15);
	let selectedMethod = $state('');
	let ratingMin = $state(0);
	let ratingMax = $state(10);

	// sync local state from filters when dialog opens
	$effect(() => {
		if (open) {
			readyToMake = filters.readyToMake === '1';
			ingredientValue = filters.ingredient ? String(filters.ingredient) : null;
			ingredientLabel = '';
			strengthMin = filters.strengthMin ? Number(filters.strengthMin) : 0;
			strengthMax = filters.strengthMax ? Number(filters.strengthMax) : 10;
			ingredientCountMin = filters.ingredientCountMin ? Number(filters.ingredientCountMin) : 0;
			ingredientCountMax = filters.ingredientCountMax ? Number(filters.ingredientCountMax) : 15;
			selectedMethod = filters.method ? String(filters.method) : '';
			ratingMin = filters.ratingMin ? Number(filters.ratingMin) : 0;
			ratingMax = filters.ratingMax ? Number(filters.ratingMax) : 10;
		}
	});

	const methodLabel = $derived.by(() => {
		if (!selectedMethod) return 'Any method';
		const m = preparationMethods.find(
			(p) => String(p.recipeTechniqueDescriptionId) === selectedMethod
		);
		return m?.recipeTechniqueDescriptionText || 'Any method';
	});

	function clearAll() {
		readyToMake = false;
		ingredientValue = null;
		ingredientLabel = '';
		strengthMin = 0;
		strengthMax = 10;
		ingredientCountMin = 0;
		ingredientCountMax = 15;
		selectedMethod = '';
		ratingMin = 0;
		ratingMax = 10;
	}

	function handleApply() {
		const params: Record<string, string> = {};
		if (readyToMake) params.readyToMake = '1';
		if (ingredientValue) params.ingredient = String(ingredientValue);
		if (strengthMin > 0) params.strengthMin = String(strengthMin);
		if (strengthMax < 10) params.strengthMax = String(strengthMax);
		if (ingredientCountMin > 0) params.ingredientCountMin = String(ingredientCountMin);
		if (ingredientCountMax < 15) params.ingredientCountMax = String(ingredientCountMax);
		if (selectedMethod) params.method = selectedMethod;
		if (ratingMin > 0) params.ratingMin = String(ratingMin);
		if (ratingMax < 10) params.ratingMax = String(ratingMax);
		onsearch?.(params);
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg max-h-[85vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Advanced Search</Dialog.Title>
			<Dialog.Description>Narrow down recipes with detailed filters</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			<!-- ready to make -->
			<div class="flex items-center justify-between rounded-lg border p-4">
				<div class="space-y-0.5">
					<Label>Ready to Make</Label>
					<p class="text-sm text-muted-foreground">
						Only show recipes you have all ingredients for
					</p>
				</div>
				<Switch bind:checked={readyToMake} />
			</div>

			<!-- ingredient filter -->
			<div class="space-y-2">
				<Label>Contains Ingredient</Label>
				<Autocomplete
					label=""
					bind:value={ingredientValue}
					key={ingredientLabel}
					fetchUrl="/api/select/products"
					placeholder="Search for an ingredient..."
				/>
			</div>

			<!-- strength range -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<Label>Strength Rating</Label>
					<span class="text-sm text-muted-foreground">{strengthMin} - {strengthMax}</span>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-xs text-muted-foreground w-4">0</span>
					<div class="flex-1 space-y-2">
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground w-6">Min</span>
							<Slider bind:value={strengthMin} min={0} max={10} step={1} class="flex-1" />
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground w-6">Max</span>
							<Slider bind:value={strengthMax} min={0} max={10} step={1} class="flex-1" />
						</div>
					</div>
					<span class="text-xs text-muted-foreground w-4">10</span>
				</div>
			</div>

			<!-- ingredient count range -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<Label>Number of Ingredients</Label>
					<span class="text-sm text-muted-foreground"
						>{ingredientCountMin} - {ingredientCountMax}</span
					>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-xs text-muted-foreground w-4">0</span>
					<div class="flex-1 space-y-2">
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground w-6">Min</span>
							<Slider bind:value={ingredientCountMin} min={0} max={15} step={1} class="flex-1" />
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground w-6">Max</span>
							<Slider bind:value={ingredientCountMax} min={0} max={15} step={1} class="flex-1" />
						</div>
					</div>
					<span class="text-xs text-muted-foreground w-4">15</span>
				</div>
			</div>

			<!-- preparation method -->
			<div class="space-y-2">
				<Label>Preparation Method</Label>
				<Select.Root
					type="single"
					value={selectedMethod}
					onValueChange={(v) => (selectedMethod = v ?? '')}
				>
					<Select.Trigger class="w-full">
						<Select.Value placeholder="Any method">{methodLabel}</Select.Value>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="" label="Any method" />
						{#each preparationMethods as pm}
							<Select.Item
								value={String(pm.recipeTechniqueDescriptionId)}
								label={pm.recipeTechniqueDescriptionText}
							/>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<!-- overall rating range -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<Label>Overall Rating</Label>
					<span class="text-sm text-muted-foreground"
						>{ratingMin.toFixed(1)} - {ratingMax.toFixed(1)}</span
					>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-xs text-muted-foreground w-4">0</span>
					<div class="flex-1 space-y-2">
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground w-6">Min</span>
							<Slider bind:value={ratingMin} min={0} max={10} step={0.5} class="flex-1" />
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground w-6">Max</span>
							<Slider bind:value={ratingMax} min={0} max={10} step={0.5} class="flex-1" />
						</div>
					</div>
					<span class="text-xs text-muted-foreground w-4">10</span>
				</div>
			</div>
		</div>

		<Dialog.Footer>
			<Button type="button" variant="ghost" onclick={clearAll}>Clear All</Button>
			<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button type="button" onclick={handleApply}>Apply Filters</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
