<script lang="ts">
	// mirrors InventoryTable / InventoryCard shapes so the swap-in during a workspace switch is seamless
	let {
		viewMode = 'table',
		count = 8,
		showStock = true,
		selectable = false,
	}: {
		viewMode?: 'grid' | 'list' | 'table';
		count?: number;
		showStock?: boolean;
		selectable?: boolean;
	} = $props();
</script>

{#if viewMode === 'table'}
	<div class="glass-panel isolate overflow-hidden" aria-busy="true" aria-label="Loading inventory">
		<!-- header -->
		<div class="hidden sm:flex items-center gap-4 px-6 py-3 border-b border-white/10">
			{#if selectable}<div class="shimmer h-4 w-4 rounded"></div>{/if}
			<div class="shimmer h-4 w-32 rounded-md"></div>
			<div class="shimmer h-4 w-24 rounded-md"></div>
			{#if showStock}<div class="shimmer h-4 w-20 rounded-md"></div>{/if}
			<div class="shimmer h-4 w-16 rounded-md ml-auto"></div>
			<div class="shimmer h-4 w-20 rounded-md"></div>
		</div>
		<!-- rows -->
		{#each Array(count) as _}
			<div class="flex items-center gap-4 px-6 py-3 border-b border-white/5 last:border-b-0">
				{#if selectable}<div class="shimmer h-4 w-4 rounded shrink-0"></div>{/if}
				<div class="shimmer h-4 w-40 rounded-md"></div>
				<div class="shimmer h-4 w-24 rounded-md hidden sm:block"></div>
				{#if showStock}<div class="shimmer h-4 w-20 rounded-md hidden sm:block"></div>{/if}
				<div class="shimmer h-4 w-8 rounded-md hidden sm:block ml-auto"></div>
				<div class="shimmer h-6 w-16 rounded-full hidden sm:block"></div>
			</div>
		{/each}
	</div>
{:else if viewMode === 'grid'}
	<div
		class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
		aria-busy="true"
		aria-label="Loading inventory"
	>
		{#each Array(count) as _}
			<div
				class="rounded-2xl overflow-hidden border border-white/40 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.06]"
			>
				<div class="shimmer h-44 w-full"></div>
				<div class="p-4 space-y-2">
					<div class="shimmer h-5 w-3/4 rounded-md"></div>
					<div class="shimmer h-4 w-full rounded-md"></div>
					<div class="shimmer h-4 w-2/3 rounded-md"></div>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="flex flex-col gap-3" aria-busy="true" aria-label="Loading inventory">
		{#each Array(count) as _}
			<div
				class="flex items-center gap-4 p-3 rounded-2xl border border-white/40 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.06]"
			>
				<div class="shimmer w-20 h-20 shrink-0 rounded-lg"></div>
				<div class="flex-1 min-w-0 space-y-2">
					<div class="shimmer h-4 w-1/2 rounded-md"></div>
					<div class="shimmer h-3 w-2/3 rounded-md"></div>
					<div class="shimmer h-3 w-1/4 rounded-md"></div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	/* sweeping highlight across a muted base — themed via css vars, works in light/dark */
	.shimmer {
		background: linear-gradient(
			90deg,
			hsl(var(--muted)) 25%,
			hsl(var(--muted-foreground) / 0.15) 50%,
			hsl(var(--muted)) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shimmer {
			animation: none;
		}
	}
</style>
