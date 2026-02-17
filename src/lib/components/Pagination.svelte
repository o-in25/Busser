<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import type { PaginationData } from '$lib/types/shared';

	let {
		pagination,
		itemLabel = 'items',
		onNavigate,
	}: {
		pagination: PaginationData;
		itemLabel?: string;
		onNavigate: (page: number) => void;
	} = $props();

	const totalPages = $derived(Math.ceil(pagination.total / pagination.perPage));

	// generate a condensed page range with ellipses for large page counts
	const pageRange = $derived.by(() => {
		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		const current = pagination.currentPage;
		const pages: (number | '...')[] = [1];

		if (current > 3) pages.push('...');

		const start = Math.max(2, current - 1);
		const end = Math.min(totalPages - 1, current + 1);
		for (let i = start; i <= end; i++) pages.push(i);

		if (current < totalPages - 2) pages.push('...');

		pages.push(totalPages);
		return pages;
	});
</script>

{#if pagination.total > 0}
	<div class="flex flex-col items-center justify-center gap-2 py-6">
		<div class="text-sm text-muted-foreground">
			Page <span class="font-semibold text-foreground">{pagination.currentPage}</span>
			of <span class="font-semibold text-foreground">{totalPages}</span>
			&middot;
			<span class="font-semibold text-foreground">{pagination.total}</span>
			{itemLabel}
		</div>

		{#if totalPages > 1}
			<nav class="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					onclick={() => onNavigate(pagination.prevPage || pagination.currentPage)}
					disabled={!pagination.prevPage}
				>
					<span class="sr-only">Previous</span>
					<ChevronLeft class="w-4 h-4" />
				</Button>

				{#each pageRange as p}
					{#if p === '...'}
						<span class="px-1 text-sm text-muted-foreground">...</span>
					{:else}
						<Button
							variant={p === pagination.currentPage ? 'default' : 'outline'}
							size="sm"
							class="h-8 w-8 p-0"
							onclick={() => onNavigate(p)}
						>
							{p}
						</Button>
					{/if}
				{/each}

				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					onclick={() => onNavigate(pagination.nextPage || pagination.currentPage)}
					disabled={!pagination.nextPage}
				>
					<span class="sr-only">Next</span>
					<ChevronRight class="w-4 h-4" />
				</Button>
			</nav>
		{/if}
	</div>
{/if}
