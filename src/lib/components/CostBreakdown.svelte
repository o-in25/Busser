<script lang="ts">
	import { GlassWater, Wallet } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';

	const { costBreakdown }: {
		costBreakdown: {
			averageCost: number;
			cheapest: { recipeName: string; recipeId: number; recipeImageUrl: string | null; cost: number } | null;
			priciest: { recipeName: string; recipeId: number; recipeImageUrl: string | null; cost: number } | null;
			barValue: number;
			barValueByCategory: { groupName: string; value: number }[];
		};
	} = $props();

	function fmt(value: number): string {
		return `$${value.toFixed(2)}`;
	}

	function fmtShort(value: number): string {
		if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
		return `$${value.toFixed(0)}`;
	}

	// position of average on the range bar (0-100%)
	const rangePosition = $derived.by(() => {
		if (!costBreakdown.cheapest || !costBreakdown.priciest) return 50;
		const min = costBreakdown.cheapest.cost;
		const max = costBreakdown.priciest.cost;
		if (max === min) return 50;
		return ((costBreakdown.averageCost - min) / (max - min)) * 100;
	});

	const maxCategoryValue = $derived(
		costBreakdown.barValueByCategory.length > 0
			? costBreakdown.barValueByCategory[0].value
			: 1
	);
</script>

<div class="space-y-4">
	<!-- hero: average cost -->
	<div class="text-center py-3">
		<p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">avg. per cocktail</p>
		<p class="text-4xl font-bold tracking-tight">{fmt(costBreakdown.averageCost)}</p>
	</div>

	<!-- price range bar -->
	{#if costBreakdown.cheapest && costBreakdown.priciest && costBreakdown.cheapest.cost !== costBreakdown.priciest.cost}
		<div class="px-1">
			<div class="relative h-2 rounded-full bg-gradient-to-r from-neon-green-500/30 via-neon-amber-500/30 to-primary/30">
				<!-- average marker -->
				<div
					class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-sm"
					style="left: clamp(6px, {rangePosition}%, calc(100% - 6px))"
				></div>
			</div>
			<div class="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
				<span>{fmt(costBreakdown.cheapest.cost)}</span>
				<span>{fmt(costBreakdown.priciest.cost)}</span>
			</div>
		</div>
	{/if}

	<!-- cheapest & priciest side by side -->
	{#if costBreakdown.cheapest && costBreakdown.priciest}
		<div class="grid grid-cols-2 gap-2">
			<a href="/catalog/{costBreakdown.cheapest.recipeId}" class="group rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-colors">
				<div class="relative h-20">
					{#if costBreakdown.cheapest.recipeImageUrl}
						<img
							src={costBreakdown.cheapest.recipeImageUrl}
							alt={costBreakdown.cheapest.recipeName}
							class="w-full h-full object-cover"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
					{:else}
						<div class="w-full h-full flex items-center justify-center bg-neon-green-500/5">
							<GlassWater class="h-6 w-6 text-muted-foreground/30" />
						</div>
					{/if}
					<Badge class="absolute top-1.5 right-1.5 bg-neon-green-500/90 text-white text-[10px] px-1.5 py-0">
						{fmt(costBreakdown.cheapest.cost)}
					</Badge>
				</div>
				<div class="p-2">
					<p class="text-[10px] text-neon-green-500 font-medium">Best value</p>
					<p class="text-xs font-medium truncate group-hover:text-primary transition-colors">{costBreakdown.cheapest.recipeName}</p>
				</div>
			</a>

			<a href="/catalog/{costBreakdown.priciest.recipeId}" class="group rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-colors">
				<div class="relative h-20">
					{#if costBreakdown.priciest.recipeImageUrl}
						<img
							src={costBreakdown.priciest.recipeImageUrl}
							alt={costBreakdown.priciest.recipeName}
							class="w-full h-full object-cover"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
					{:else}
						<div class="w-full h-full flex items-center justify-center bg-neon-amber-500/5">
							<GlassWater class="h-6 w-6 text-muted-foreground/30" />
						</div>
					{/if}
					<Badge class="absolute top-1.5 right-1.5 bg-neon-amber-500/90 text-white text-[10px] px-1.5 py-0">
						{fmt(costBreakdown.priciest.cost)}
					</Badge>
				</div>
				<div class="p-2">
					<p class="text-[10px] text-neon-amber-500 font-medium">Top shelf</p>
					<p class="text-xs font-medium truncate group-hover:text-primary transition-colors">{costBreakdown.priciest.recipeName}</p>
				</div>
			</a>
		</div>
	{/if}

	<!-- bar value section -->
	{#if costBreakdown.barValue > 0}
		<div class="pt-3 border-t border-border/50 space-y-3">
			<!-- bar value header with money badge -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2 text-muted-foreground">
					<Wallet class="h-4 w-4" />
					<span class="text-sm">Bar Value</span>
				</div>
				<span class="inline-flex items-center gap-1 rounded-full bg-neon-green-500/15 text-neon-green-500 border border-neon-green-500/30 px-2.5 py-0.5 text-sm font-bold">
					{fmt(costBreakdown.barValue)}
				</span>
			</div>

			<!-- category breakdown -->
			{#if costBreakdown.barValueByCategory.length > 0}
				<div class="space-y-1.5">
					{#each costBreakdown.barValueByCategory as cat}
						<div class="flex items-center gap-2">
							<span class="text-[10px] text-muted-foreground w-20 truncate shrink-0">{cat.groupName}</span>
							<div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
								<div
									class="h-full rounded-full bg-neon-green-500/60 transition-all duration-500"
									style="width: {(cat.value / maxCategoryValue) * 100}%"
								></div>
							</div>
							<span class="inline-flex items-center rounded-full bg-muted px-1.5 py-0 text-[10px] font-semibold tabular-nums shrink-0">
								{fmtShort(cat.value)}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
