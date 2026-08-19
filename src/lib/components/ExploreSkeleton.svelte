<script lang="ts">
	// mirrors the explore page's workspace-dependent sections (spirit grid + recipe row)
	// so the swap-in during a workspace switch is seamless
</script>

<div aria-busy="true" aria-label="Loading">
	<!-- Explore by Spirit -->
	<section class="mb-10">
		<div class="shimmer h-8 w-56 rounded-md mb-6"></div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each Array(6) as _}
				<div class="shimmer h-48 w-full rounded-xl"></div>
			{/each}
		</div>
	</section>

	<!-- Cocktail of the Day + Recipe List -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
		<div
			class="shimmer h-72 w-full rounded-xl lg:col-span-1 border border-white/40 dark:border-white/[0.08]"
		></div>
		<div
			class="lg:col-span-2 rounded-xl border border-white/40 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.06] p-6"
		>
			<div class="shimmer h-8 w-48 rounded-full mb-6"></div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each Array(6) as _}
					<div class="flex items-center gap-3 p-3 rounded-lg border">
						<div class="shimmer w-12 h-12 shrink-0 rounded-lg"></div>
						<div class="flex-1 min-w-0 space-y-2">
							<div class="shimmer h-4 w-3/4 rounded-md"></div>
							<div class="shimmer h-3 w-1/2 rounded-md"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

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
