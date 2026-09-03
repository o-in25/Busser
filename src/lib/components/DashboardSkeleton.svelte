<!-- mirrors the authenticated dashboard layout; uses the app's .shimmer sweep on glass surfaces -->
<div aria-busy="true" aria-label="Loading dashboard">
	<!-- welcome header -->
	<section class="mb-8 mt-4">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div>
				<div class="shimmer h-9 w-72 mb-2 rounded-md"></div>
				<div class="shimmer h-5 w-64 rounded-md"></div>
			</div>
			<div class="grid grid-cols-2 gap-3 w-full md:w-auto md:flex">
				{#each Array(2) as _}
					<div
						class="rounded-xl border border-white/40 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.06] px-4 py-3 md:min-w-[180px]"
					>
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-full bg-white/40 dark:bg-white/[0.08]">
								<div class="shimmer h-5 w-5 rounded-full"></div>
							</div>
							<div>
								<div class="shimmer h-7 w-8 mb-1 rounded-md"></div>
								<div class="shimmer h-3 w-16 rounded-md"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- quick actions -->
	<section class="mb-8">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
			{#each Array(4) as _}
				<div
					class="rounded-xl border border-white/40 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.06] p-4"
				>
					<div class="flex items-center gap-3">
						<div class="shimmer h-9 w-9 rounded-lg"></div>
						<div>
							<div class="shimmer h-4 w-24 mb-1 rounded-md"></div>
							<div class="shimmer h-3 w-16 rounded-md"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- recipe grid placeholder -->
	<section class="mb-8">
		<div class="shimmer h-7 w-40 mb-2 rounded-md"></div>
		<div class="shimmer h-4 w-64 mb-4 rounded-md"></div>
		<div class="flex gap-2 mb-4">
			{#each Array(4) as _}
				<div class="shimmer h-8 w-20 rounded-full"></div>
			{/each}
		</div>
		<div class="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each Array(8) as _}
				<div
					class="rounded-2xl overflow-hidden border border-white/40 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.06]"
				>
					<div class="shimmer aspect-square w-full"></div>
					<div class="p-3">
						<div class="shimmer h-4 w-3/4 mb-1 rounded-md"></div>
						<div class="shimmer h-3 w-full rounded-md"></div>
					</div>
				</div>
			{/each}
		</div>
	</section>
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
