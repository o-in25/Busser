<script lang="ts">
	import { ArrowRight, Trophy } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { idToSlug } from '$lib/spirits';

	const { topSpirit, spiritCounts, availableCount, allSpirits }: {
		topSpirit: { recipeCategoryId: number; recipeCategoryDescription: string | null; recipeCategoryDescriptionImageUrl: string | null };
		spiritCounts: Record<number, number>;
		availableCount: number;
		allSpirits: { recipeCategoryId: number; recipeCategoryDescription: string | null; recipeCategoryDescriptionImageUrl: string | null }[];
	} = $props();

	const topCount = $derived(spiritCounts[topSpirit.recipeCategoryId] || 0);
	const percentage = $derived(availableCount > 0 ? Math.round((topCount / availableCount) * 100) : 0);

	// circumference for the ring indicator
	const ringR = 36;
	const circumference = 2 * Math.PI * ringR;
	const dashOffset = $derived(circumference - (percentage / 100) * circumference);

	// all spirits sorted by count (descending), include zeroes
	const allSorted = $derived.by(() => {
		return allSpirits
			.map((s) => ({ ...s, count: spiritCounts[s.recipeCategoryId] || 0 }))
			.sort((a, b) => b.count - a.count);
	});

	const maxCount = $derived(allSorted.length > 0 && allSorted[0].count > 0 ? allSorted[0].count : 1);
</script>

<div class="space-y-3">
	<!-- hero: ring chart + stat -->
	<div class="flex items-center gap-4">
		<!-- donut ring -->
		<div class="relative shrink-0">
			<svg width="80" height="80" viewBox="0 0 88 88" class="rotate-[-90deg]">
				<circle
					cx="44"
					cy="44"
					r={ringR}
					fill="none"
					stroke="currentColor"
					stroke-opacity="0.08"
					stroke-width="6"
				/>
				<circle
					cx="44"
					cy="44"
					r={ringR}
					fill="none"
					stroke="hsl(var(--primary))"
					stroke-width="6"
					stroke-linecap="round"
					stroke-dasharray={circumference}
					stroke-dashoffset={dashOffset}
					class="transition-all duration-700"
				/>
			</svg>
			<!-- spirit image in center -->
			<div class="absolute inset-0 flex items-center justify-center">
				{#if topSpirit.recipeCategoryDescriptionImageUrl}
					<img
						src={topSpirit.recipeCategoryDescriptionImageUrl}
						alt={topSpirit.recipeCategoryDescription}
						class="w-11 h-11 rounded-full object-cover border-2 border-background"
					/>
				{:else}
					<div class="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
						<Trophy class="h-5 w-5 text-primary" />
					</div>
				{/if}
			</div>
		</div>

		<!-- stat text -->
		<div class="flex-1 min-w-0">
			<p class="text-3xl font-bold tracking-tight">{topCount}</p>
			<p class="text-xs text-muted-foreground">
				{topSpirit.recipeCategoryDescription} cocktails
			</p>
			<p class="text-xs text-primary font-medium mt-0.5">
				{percentage}% of your bar
			</p>
		</div>
	</div>

	<!-- all spirits breakdown -->
	{#if allSorted.length > 1}
		<div class="space-y-1.5">
			{#each allSorted as spirit}
				<div class="flex items-center gap-2">
					{#if spirit.recipeCategoryDescriptionImageUrl}
						<img
							src={spirit.recipeCategoryDescriptionImageUrl}
							alt={spirit.recipeCategoryDescription}
							class="w-5 h-5 rounded-full object-cover shrink-0"
						/>
					{:else}
						<div class="w-5 h-5 rounded-full bg-muted shrink-0"></div>
					{/if}
					<span class="text-[10px] text-muted-foreground w-14 truncate shrink-0">{spirit.recipeCategoryDescription}</span>
					<div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
						<div
							class={cn(
								'h-full rounded-full transition-all duration-500',
								spirit.recipeCategoryId === topSpirit.recipeCategoryId ? 'bg-primary' : 'bg-primary/40'
							)}
							style="width: {spirit.count > 0 ? (spirit.count / maxCount) * 100 : 0}%"
						></div>
					</div>
					<span class={cn(
						'text-[10px] font-semibold w-4 text-right tabular-nums',
						spirit.count === 0 ? 'text-muted-foreground/40' : ''
					)}>{spirit.count}</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- explore link -->
	<div class="pt-2 border-t border-border/50">
		<a
			href="/catalog/browse/{idToSlug[topSpirit.recipeCategoryId] ?? topSpirit.recipeCategoryId}"
			class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-center gap-2 h-7 text-xs')}
		>
			Explore {topSpirit.recipeCategoryDescription} Cocktails
			<ArrowRight class="h-3.5 w-3.5" />
		</a>
	</div>
</div>
