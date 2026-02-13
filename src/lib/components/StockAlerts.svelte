<script lang="ts">
	import { ArrowRight, ChevronDown, XCircle } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	import type { Product } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		outOfStockItems,
	}: {
		outOfStockItems: Product[];
	} = $props();

	let outOfStockOpen = $state(false);

	const hasAlerts = $derived(outOfStockItems.length > 0);
</script>

{#if hasAlerts}
	<div class="space-y-4 mb-6">
		<!-- Out of Stock Section -->
		{#if outOfStockItems.length > 0}
			<div
				class="rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 overflow-hidden"
			>
				<button
					type="button"
					class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors"
					onclick={() => (outOfStockOpen = !outOfStockOpen)}
				>
					<div class="flex items-center gap-2">
						<XCircle class="h-5 w-5 text-red-500" />
						<span class="font-semibold text-red-700 dark:text-red-400">
							Out of Stock ({outOfStockItems.length})
						</span>
					</div>
					<ChevronDown
						class={cn(
							'h-4 w-4 text-red-500 transition-transform duration-200',
							outOfStockOpen && 'rotate-180'
						)}
					/>
				</button>
				{#if outOfStockOpen}
					<div transition:slide={{ duration: 200 }}>
						<div class="px-4 pb-3 space-y-2">
							{#each outOfStockItems as item}
								<a
									href="/inventory/{item.productId}/edit"
									class="flex items-center justify-between p-2 rounded-md bg-background/80 hover:bg-background transition-colors group"
								>
									<div class="flex items-center gap-3 min-w-0">
										{#if item.productImageUrl}
											<img
												src={item.productImageUrl}
												alt={item.productName}
												class="w-8 h-8 rounded object-cover"
											/>
										{:else}
											<div class="w-8 h-8 rounded bg-muted flex items-center justify-center">
												<XCircle class="h-4 w-4 text-red-400" />
											</div>
										{/if}
										<div class="min-w-0">
											<p class="font-medium truncate group-hover:text-primary transition-colors">
												{item.productName}
											</p>
											<p class="text-xs text-muted-foreground truncate">{item.categoryName}</p>
										</div>
									</div>
									<ArrowRight
										class="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0"
									/>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
