<script lang="ts">
	import { Layers, Package } from 'lucide-svelte';

	import * as Select from '$lib/components/ui/select';

	let {
		categoryGroups,
		activeGroup,
		perPage,
		onGroupChange,
		onPerPageChange,
		onReset,
	}: {
		categoryGroups: { name: string; count: number }[];
		activeGroup: string | null;
		perPage: number;
		onGroupChange: (value: string | null) => void;
		onPerPageChange: (value: number) => void;
		onReset?: () => void;
	} = $props();

	const perPageOptions = [10, 25, 50, 100];

	const groupLabel = $derived(activeGroup ?? 'All Groups');

	const hasNonDefaultFilters = $derived(perPage !== 50 || activeGroup !== null);
</script>

<div class="flex flex-col gap-4">
	<!-- group -->
	{#if categoryGroups.length >= 2}
		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-muted-foreground">Group</span>
			<Select.Root
				type="single"
				value={activeGroup ?? 'all'}
				onValueChange={(v) => onGroupChange(v === 'all' ? null : (v ?? null))}
			>
				<Select.Trigger class="w-full">
					<Layers class="h-4 w-4 mr-2" />
					<Select.Value placeholder="All Groups">{groupLabel}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All Groups" />
					<Select.Separator />
					{#each categoryGroups as group}
						<Select.Item value={group.name} label="{group.name} ({group.count})" />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	{/if}

	<!-- per page -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-muted-foreground">Per Page</span>
		<Select.Root
			type="single"
			value={String(perPage)}
			onValueChange={(v) => {
				if (v) onPerPageChange(Number(v));
			}}
		>
			<Select.Trigger class="w-full">
				<Package class="h-4 w-4 mr-2" />
				<Select.Value placeholder="50 per page">{perPage} per page</Select.Value>
			</Select.Trigger>
			<Select.Content>
				{#each perPageOptions as opt}
					<Select.Item value={String(opt)} label="{opt} per page" />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- reset -->
	{#if hasNonDefaultFilters && onReset}
		<button
			onclick={onReset}
			class="text-sm text-muted-foreground hover:text-foreground underline self-start"
		>
			Reset filters
		</button>
	{/if}
</div>
