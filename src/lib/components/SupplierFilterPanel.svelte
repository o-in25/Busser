<script lang="ts">
	import { ArrowUpDown, Store } from 'lucide-svelte';

	import * as Select from '$lib/components/ui/select';

	let {
		types = [],
		selectedType,
		sortOption,
		onTypeChange,
		onSortChange,
		onReset,
	}: {
		types?: { value: string; label: string }[];
		selectedType: string;
		sortOption: string;
		onTypeChange: (value: string) => void;
		onSortChange: (value: string) => void;
		onReset: () => void;
	} = $props();

	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'products', label: 'Most products' },
	];

	const typeLabel = $derived.by(() => {
		if (!selectedType || selectedType === 'all') return 'All Types';
		return types.find((t) => t.value === selectedType)?.label || 'All Types';
	});

	const sortLabel = $derived(
		sortOptions.find((o) => o.value === sortOption)?.label || 'Name (A-Z)'
	);

	const hasNonDefaultFilters = $derived(
		(selectedType && selectedType !== 'all') || sortOption !== 'name-asc'
	);
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 sm:grid-flow-row-dense gap-4">
	<!-- type -->
	{#if types.length > 0}
		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-muted-foreground">Type</span>
			<Select.Root type="single" value={selectedType} onValueChange={(v) => onTypeChange(v ?? '')}>
				<Select.Trigger class="w-full">
					<Store class="h-4 w-4 mr-2" />
					<Select.Value placeholder="All Types">{typeLabel}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All Types" />
					<Select.Separator />
					{#each types as t}
						<Select.Item value={t.value} label={t.label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	{/if}

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

	<!-- reset -->
	{#if hasNonDefaultFilters}
		<button
			onclick={onReset}
			class="text-sm text-muted-foreground hover:text-foreground underline justify-self-start sm:col-span-2"
		>
			Reset filters
		</button>
	{/if}
</div>
