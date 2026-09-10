<script lang="ts">
	import {
		ArrowUpDown,
		ChevronRight,
		GlassWater,
		RotateCcw,
		SlidersHorizontal,
		Sparkles,
	} from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { moods } from '$lib/spirits';

	let {
		spirits,
		selectedSpirit,
		selectedMood = '',
		sortOption,
		perPage = '24',
		advancedFilterCount = 0,
		hideSpirit = false,
		onSpiritChange,
		onMoodChange,
		onSortChange,
		onPerPageChange,
		onReset,
		onAdvancedClick,
	}: {
		spirits: { recipeCategoryId: number; recipeCategoryDescription: string | null }[];
		selectedSpirit: string;
		selectedMood?: string;
		sortOption: string;
		perPage?: string;
		advancedFilterCount?: number;
		hideSpirit?: boolean;
		onSpiritChange: (value: string) => void;
		onMoodChange?: (value: string) => void;
		onSortChange: (value: string) => void;
		onPerPageChange?: (value: string) => void;
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

	const perPageOptions = [
		{ value: '12', label: '12 / page' },
		{ value: '24', label: '24 / page' },
		{ value: '48', label: '48 / page' },
		{ value: '96', label: '96 / page' },
	];

	const spiritLabel = $derived.by(() => {
		if (!selectedSpirit || selectedSpirit === 'all') return 'All Spirits';
		const spirit = spirits.find((s) => String(s.recipeCategoryId) === selectedSpirit);
		return spirit?.recipeCategoryDescription || 'All Spirits';
	});

	// mood is multi-select; the parent contract stays a comma-joined string
	const moodIds = $derived(selectedMood ? selectedMood.split(',') : []);
	const moodLabel = $derived.by(() => {
		if (moodIds.length === 0) return 'All Moods';
		if (moodIds.length === 1) return moods.find((m) => m.id === moodIds[0])?.label ?? 'All Moods';
		return `${moodIds.length} moods`;
	});

	const sortLabel = $derived.by(() => {
		const option = sortOptions.find((o) => o.value === sortOption);
		return option?.label || 'Name (A-Z)';
	});

	const perPageLabel = $derived.by(() => {
		const option = perPageOptions.find((o) => o.value === perPage);
		return option?.label || '24 / page';
	});

	const hasNonDefaultFilters = $derived(
		(selectedSpirit && selectedSpirit !== 'all') ||
			!!selectedMood ||
			sortOption !== 'name-asc' ||
			perPage !== '24'
	);
</script>

<div class="flex flex-col gap-4">
	<!-- tier 1: primary dropdowns -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		{#if !hideSpirit}
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
		{/if}

		{#if onMoodChange}
			<div class="flex flex-col gap-1.5">
				<span class="text-sm font-medium text-muted-foreground">Mood</span>
				<Select.Root
					type="multiple"
					value={moodIds}
					onValueChange={(v) => onMoodChange?.((v ?? []).join(','))}
				>
					<Select.Trigger class="w-full">
						<Sparkles class="h-4 w-4 mr-2" />
						<Select.Value placeholder="All Moods">{moodLabel}</Select.Value>
					</Select.Trigger>
					<Select.Content>
						{#each moods as mood}
							<Select.Item value={mood.id} label={mood.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		{/if}
	</div>

	<!-- tier 2: sort + page size (page size demoted, compact) -->
	<div class="flex flex-wrap items-end gap-4">
		<div class="flex flex-col gap-1.5 flex-1 min-w-[12rem]">
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

		{#if onPerPageChange}
			<div class="flex flex-col gap-1.5">
				<span class="text-sm font-medium text-muted-foreground">Per page</span>
				<Select.Root
					type="single"
					value={perPage}
					onValueChange={(v) => onPerPageChange(v ?? '24')}
				>
					<Select.Trigger class="w-auto min-w-[7.5rem]">
						<Select.Value placeholder="24 / page">{perPageLabel}</Select.Value>
					</Select.Trigger>
					<Select.Content>
						{#each perPageOptions as option}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		{/if}
	</div>

	<!-- tier 4: advanced filters link (desktop popover only; mobile sheet expands these inline) -->
	{#if onAdvancedClick}
		<div class="hidden md:block border-t border-border/50 pt-3">
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

	<!-- clear: promoted to a real button, only when filters are active (desktop popover only;
	     the mobile sheet has its own Clear in the footer) -->
	{#if hasNonDefaultFilters}
		<div class="hidden md:flex justify-end border-t border-border/50 pt-3">
			<Button variant="outline" size="sm" onclick={onReset}>
				<RotateCcw class="h-4 w-4 mr-2" />
				Clear filters
			</Button>
		</div>
	{/if}
</div>
