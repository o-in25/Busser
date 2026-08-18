<script lang="ts">
	// mirrors CatalogBrowseCard's grid/list shapes so the swap-in is seamless
	let { viewMode = 'grid', count = 8 }: { viewMode?: 'grid' | 'list'; count?: number } = $props();
</script>

{#if viewMode === 'grid'}
	<div
		class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
		aria-busy="true"
		aria-label="Loading recipes"
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
	<div class="flex flex-col gap-3" aria-busy="true" aria-label="Loading recipes">
		{#each Array(count) as _}
			<div
				class="flex items-center gap-3 p-3 rounded-2xl border border-white/40 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.06]"
			>
				<div class="shimmer w-16 h-16 shrink-0 rounded-xl"></div>
				<div class="flex-1 min-w-0 space-y-2">
					<div class="shimmer h-4 w-1/2 rounded-md"></div>
					<div class="shimmer h-3 w-1/3 rounded-md"></div>
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
