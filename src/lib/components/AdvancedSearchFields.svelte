<script lang="ts">
	import { X } from 'lucide-svelte';
	import SearchableSelect from '$lib/components/form/SearchableSelect.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import type { PreparationMethod, SelectOption } from '$lib/types';

	let {
		active = false,
		preparationMethods = [],
		filters = {},
		applyLabel = 'Apply Filters',
		showActions = true,
		onsearch,
		oncancel,
		onRegister,
	}: {
		active?: boolean;
		preparationMethods?: PreparationMethod[];
		filters?: Record<string, any>;
		applyLabel?: string;
		showActions?: boolean;
		onsearch?: (params: Record<string, string>) => void;
		oncancel?: () => void;
		onRegister?: (api: { apply: () => void; clear: () => void } | null) => void;
	} = $props();

	type IngredientTag = { value: number; name: string };

	let includeIngredients = $state<IngredientTag[]>([]);
	let anyIngredients = $state<IngredientTag[]>([]);
	let excludeIngredients = $state<IngredientTag[]>([]);
	let includeDisplay = $state('');
	let anyDisplay = $state('');
	let excludeDisplay = $state('');
	let strengthMin = $state(0);
	let strengthMax = $state(10);
	let ingredientCountMin = $state(0);
	let ingredientCountMax = $state(15);
	let selectedMethod = $state('');
	let ratingMin = $state(0);
	let ratingMax = $state(10);

	function rebuildTags(idsStr: string, namesMap: Record<number, string>): IngredientTag[] {
		if (!idsStr) return [];
		return idsStr
			.split(',')
			.map(Number)
			.filter((n) => !isNaN(n) && n > 0)
			.map((id) => ({ value: id, name: namesMap[id] || String(id) }));
	}

	$effect(() => {
		if (active) {
			const names = filters.ingredientNames || {};
			includeIngredients = rebuildTags(filters.ingredientInclude, names);
			anyIngredients = rebuildTags(filters.ingredientAny, names);
			excludeIngredients = rebuildTags(filters.ingredientExclude, names);
			includeDisplay = '';
			anyDisplay = '';
			excludeDisplay = '';
			strengthMin = filters.strengthMin ? Number(filters.strengthMin) : 0;
			strengthMax = filters.strengthMax ? Number(filters.strengthMax) : 10;
			ingredientCountMin = filters.ingredientCountMin ? Number(filters.ingredientCountMin) : 0;
			ingredientCountMax = filters.ingredientCountMax ? Number(filters.ingredientCountMax) : 15;
			selectedMethod = filters.method ? String(filters.method) : '';
			ratingMin = filters.ratingMin ? Number(filters.ratingMin) : 0;
			ratingMax = filters.ratingMax ? Number(filters.ratingMax) : 10;
		}
	});

	function addIngredient(list: IngredientTag[], item: SelectOption): IngredientTag[] {
		const id = Number(item.value);
		if (list.some((t) => t.value === id)) return list;
		return [...list, { value: id, name: item.name }];
	}

	function removeIngredient(list: IngredientTag[], id: number): IngredientTag[] {
		return list.filter((t) => t.value !== id);
	}

	function handleIncludeSelect(item: SelectOption) {
		includeIngredients = addIngredient(includeIngredients, item);
		includeDisplay = '';
	}

	function handleAnySelect(item: SelectOption) {
		anyIngredients = addIngredient(anyIngredients, item);
		anyDisplay = '';
	}

	function handleExcludeSelect(item: SelectOption) {
		excludeIngredients = addIngredient(excludeIngredients, item);
		excludeDisplay = '';
	}

	const methodLabel = $derived.by(() => {
		if (!selectedMethod) return 'Any method';
		const m = preparationMethods.find(
			(p) => String(p.recipeTechniqueDescriptionId) === selectedMethod
		);
		return m?.recipeTechniqueDescriptionText || 'Any method';
	});

	function clearAll() {
		includeIngredients = [];
		anyIngredients = [];
		excludeIngredients = [];
		includeDisplay = '';
		anyDisplay = '';
		excludeDisplay = '';
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
		if (includeIngredients.length)
			params.ingredientInclude = includeIngredients.map((t) => t.value).join(',');
		if (anyIngredients.length) params.ingredientAny = anyIngredients.map((t) => t.value).join(',');
		if (excludeIngredients.length)
			params.ingredientExclude = excludeIngredients.map((t) => t.value).join(',');
		if (strengthMin > 0) params.strengthMin = String(strengthMin);
		if (strengthMax < 10) params.strengthMax = String(strengthMax);
		if (ingredientCountMin > 0) params.ingredientCountMin = String(ingredientCountMin);
		if (ingredientCountMax < 15) params.ingredientCountMax = String(ingredientCountMax);
		if (selectedMethod) params.method = selectedMethod;
		if (ratingMin > 0) params.ratingMin = String(ratingMin);
		if (ratingMax < 10) params.ratingMax = String(ratingMax);
		onsearch?.(params);
	}

	$effect(() => {
		onRegister?.({ apply: handleApply, clear: clearAll });
		return () => onRegister?.(null);
	});
</script>

<div class="space-y-6 py-4">
	<!-- ingredient filters -->
	<div class="space-y-3">
		<Label>Ingredient Filters</Label>
		<div class="space-y-1">
			<span class="text-xs text-muted-foreground">Must include all</span>
			<SearchableSelect
				label=""
				bind:display={includeDisplay}
				fetchUrl="/api/select/products"
				placeholder="Recipe must contain every ingredient..."
				onselect={handleIncludeSelect}
			/>
			{#if includeIngredients.length > 0}
				<div class="flex flex-wrap gap-1.5 pt-1">
					{#each includeIngredients as tag}
						<Badge variant="secondary" class="gap-1">
							{tag.name}
							<button
								onclick={() =>
									(includeIngredients = removeIngredient(includeIngredients, tag.value))}
								class="ml-0.5 hover:text-destructive"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/each}
				</div>
			{/if}
		</div>
		<div class="space-y-1">
			<span class="text-xs text-muted-foreground">Must include any</span>
			<SearchableSelect
				label=""
				bind:display={anyDisplay}
				fetchUrl="/api/select/products"
				placeholder="Recipe must contain at least one..."
				onselect={handleAnySelect}
			/>
			{#if anyIngredients.length > 0}
				<div class="flex flex-wrap gap-1.5 pt-1">
					{#each anyIngredients as tag}
						<Badge variant="secondary" class="gap-1">
							{tag.name}
							<button
								onclick={() => (anyIngredients = removeIngredient(anyIngredients, tag.value))}
								class="ml-0.5 hover:text-destructive"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/each}
				</div>
			{/if}
		</div>
		<div class="space-y-1">
			<span class="text-xs text-muted-foreground">Must not include</span>
			<SearchableSelect
				label=""
				bind:display={excludeDisplay}
				fetchUrl="/api/select/products"
				placeholder="Exclude recipes with these..."
				onselect={handleExcludeSelect}
			/>
			{#if excludeIngredients.length > 0}
				<div class="flex flex-wrap gap-1.5 pt-1">
					{#each excludeIngredients as tag}
						<Badge variant="danger" class="gap-1">
							{tag.name}
							<button
								onclick={() =>
									(excludeIngredients = removeIngredient(excludeIngredients, tag.value))}
								class="ml-0.5 hover:text-destructive-foreground"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- prep method -->
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

	<!-- strength -->
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

	<!-- ingredient count -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<Label>Number of Ingredients</Label>
			<span class="text-sm text-muted-foreground">{ingredientCountMin} - {ingredientCountMax}</span>
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

	<!-- overall rating -->
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

{#if showActions}
	<div class="flex items-center justify-end gap-2">
		<Button type="button" variant="ghost" onclick={clearAll}>Clear All</Button>
		{#if oncancel}
			<Button type="button" variant="outline" onclick={oncancel}>Cancel</Button>
		{/if}
		<Button variant="primary" type="button" onclick={handleApply}>{applyLabel}</Button>
	</div>
{/if}
