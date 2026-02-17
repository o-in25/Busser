<script lang="ts">
	import { ArrowUpDown, ChevronRight, Filter, GlassWater, SlidersHorizontal } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import * as Select from '$lib/components/ui/select';

	let {
		spirits,
		selectedSpirit,
		selectedShowFilter,
		sortOption,
		advancedFilterCount = 0,
		onSpiritChange,
		onShowFilterChange,
		onSortChange,
		onReset,
		onAdvancedClick,
	}: {
		spirits: { recipeCategoryId: number; recipeCategoryDescription: string | null }[];
		selectedSpirit: string;
		selectedShowFilter: string;
		sortOption: string;
		advancedFilterCount?: number;
		onSpiritChange: (value: string) => void;
		onShowFilterChange: (value: string) => void;
		onSortChange: (value: string) => void;
		onReset: () => void;
		onAdvancedClick?: () => void;
	} = $props();

	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'top-rated', label: 'Top Rated' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
	];

	const showFilterOptions = [
		{ value: 'all', label: 'All Recipes' },
		{ value: 'favorites', label: 'My Favorites' },
		{ value: 'featured', label: 'Featured' },
	];

	const spiritLabel = $derived.by(() => {
		if (!selectedSpirit || selectedSpirit === 'all') return 'All Spirits';
		const spirit = spirits.find((s) => String(s.recipeCategoryId) === selectedSpirit);
		return spirit?.recipeCategoryDescription || 'All Spirits';
	});

	const showFilterLabel = $derived.by(() => {
		const option = showFilterOptions.find((o) => o.value === selectedShowFilter);
		return option?.label || 'All Recipes';
	});

	const sortLabel = $derived.by(() => {
		const option = sortOptions.find((o) => o.value === sortOption);
		return option?.label || 'Name (A-Z)';
	});

	const hasNonDefaultFilters = $derived(
		(selectedSpirit && selectedSpirit !== 'all') ||
			(selectedShowFilter && selectedShowFilter !== 'all') ||
			sortOption !== 'name-asc'
	);
</script>

<div class="flex flex-col gap-4">
	<!-- spirit -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-muted-foreground">Spirit</span>
		<Select.Root
			type="single"
			value={selectedSpirit}
			onValueChange={(v) => onSpiritChange(v ?? 'all')}
		>
			<Select.Trigger class="w-full">
				<GlassWater class="h-4 w-4 mr-2" />
				<Select.Value placeholder="All Spirits">{spiritLabel}</Select.Value>
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all" label="All Spirits" />
				{#if spirits.length > 0}
					<Select.Separator />
				{/if}
				{#each spirits as spirit}
					<Select.Item
						value={String(spirit.recipeCategoryId)}
						label={spirit.recipeCategoryDescription ?? undefined}
					/>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- show filter -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-muted-foreground">Show</span>
		<Select.Root
			type="single"
			value={selectedShowFilter}
			onValueChange={(v) => onShowFilterChange(v ?? 'all')}
		>
			<Select.Trigger class="w-full">
				<Filter class="h-4 w-4 mr-2" />
				<Select.Value placeholder="All Recipes">{showFilterLabel}</Select.Value>
			</Select.Trigger>
			<Select.Content>
				{#each showFilterOptions as option}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- sort -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-muted-foreground">Sort By</span>
		<Select.Root
			type="single"
			value={sortOption}
			onValueChange={(v) => onSortChange(v ?? 'name-asc')}
		>
			<Select.Trigger class="w-full">
				<ArrowUpDown class="h-4 w-4 mr-2" />
				<Select.Value placeholder="Name (A-Z)">{sortLabel}</Select.Value>
			</Select.Trigger>
			<Select.Content>
				{#each sortOptions as option}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- advanced filters link -->
	{#if onAdvancedClick}
		<div class="border-t border-border/50 pt-3">
			<button
				onclick={onAdvancedClick}
				class="flex items-center justify-between w-full rounded-lg border border-input/50 px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors"
			>
				<span class="flex items-center gap-2">
					<SlidersHorizontal class="h-4 w-4 text-muted-foreground" />
					Advanced Filters
					{#if advancedFilterCount > 0}
						<Badge class="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
							{advancedFilterCount}
						</Badge>
					{/if}
				</span>
				<ChevronRight class="h-4 w-4 text-muted-foreground" />
			</button>
		</div>
	{/if}

	<!-- reset -->
	{#if hasNonDefaultFilters}
		<button
			onclick={onReset}
			class="text-sm text-muted-foreground hover:text-foreground underline self-start"
		>
			Reset filters
		</button>
	{/if}
</div>
