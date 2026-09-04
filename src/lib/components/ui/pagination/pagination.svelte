<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	import { cn } from '$lib/utils';
	import type { PaginationData } from '$lib/types/shared';

	let {
		pagination,
		itemLabel = 'items',
		onNavigate,
		class: className,
	}: {
		pagination: PaginationData;
		itemLabel?: string;
		onNavigate: (page: number) => void;
		class?: string;
	} = $props();

	const totalPages = $derived(Math.ceil(pagination.total / pagination.perPage));

	// condensed page range with ellipses for large page counts
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

	// shared item style — plain items go ghost, active gets the solid selected treatment
	const item =
		'inline-flex items-center justify-center h-9 rounded-full text-sm font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:pointer-events-none disabled:cursor-default';
	const ghost = 'text-foreground hover:bg-white/40 dark:hover:bg-white/[0.1]';
</script>

{#if pagination.total > 0}
	<div class={cn('flex flex-col items-center justify-center gap-3 py-6', className)}>
		{#if totalPages > 1}
			<!-- glass pill (glass-surface tier + full-round via the radius token) -->
			<nav
				class="glass-surface inline-flex items-center gap-1 p-1.5"
				style="--glass-radius: 9999px"
				aria-label="Pagination"
			>
				<button
					type="button"
					class={cn(item, ghost, 'gap-1 px-3')}
					onclick={() => onNavigate(pagination.prevPage || pagination.currentPage)}
					disabled={!pagination.prevPage}
				>
					<ChevronLeft class="h-4 w-4" />
					<span class="hidden sm:inline">Previous</span>
				</button>

				{#each pageRange as p}
					{#if p === '...'}
						<span class="px-2 text-sm text-muted-foreground select-none">&hellip;</span>
					{:else}
						<button
							type="button"
							class={cn(
								item,
								'min-w-9 px-2',
								p === pagination.currentPage ? 'glass-primary' : ghost
							)}
							aria-current={p === pagination.currentPage ? 'page' : undefined}
							onclick={() => onNavigate(p)}
						>
							{p}
						</button>
					{/if}
				{/each}

				<button
					type="button"
					class={cn(item, ghost, 'gap-1 px-3')}
					onclick={() => onNavigate(pagination.nextPage || pagination.currentPage)}
					disabled={!pagination.nextPage}
				>
					<span class="hidden sm:inline">Next</span>
					<ChevronRight class="h-4 w-4" />
				</button>
			</nav>
		{/if}

		<div class="text-sm text-muted-foreground">
			Page <span class="font-semibold text-foreground">{pagination.currentPage}</span>
			of <span class="font-semibold text-foreground">{totalPages}</span>
			&middot;
			<span class="font-semibold text-foreground">{pagination.total}</span>
			{itemLabel}
		</div>
	</div>
{/if}
