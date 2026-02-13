<script lang="ts">
	import { Award, Candy, Droplets, Gauge, Sparkles } from 'lucide-svelte';

	import * as Card from '$lib/components/ui/card';
	import { calculateAbv, calculateOverallScore } from '$lib/math';
	import type { View } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		class: className,
		recipe,
		recipeSteps,
		...restProps
	}: {
		class?: string;
		recipe: View.BasicRecipe;
		recipeSteps: View.BasicRecipeStep[];
		[key: string]: unknown;
	} = $props();

	// Rating tiers with descriptions and colors
	const ratingsMap = [
		{ max: 0, label: 'No Rating', color: 'bg-gray-500', textColor: 'text-gray-500' },
		{ max: 1, label: 'Swill', color: 'bg-red-600', textColor: 'text-red-600' },
		{ max: 2, label: 'Forgettable', color: 'bg-red-500', textColor: 'text-red-500' },
		{ max: 3, label: 'Bottom Shelf', color: 'bg-orange-500', textColor: 'text-orange-500' },
		{ max: 4, label: 'Decent', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
		{ max: 5, label: 'Standard Pour', color: 'bg-yellow-400', textColor: 'text-yellow-500' },
		{ max: 6, label: 'Good Stuff', color: 'bg-lime-500', textColor: 'text-lime-500' },
		{ max: 7, label: 'Top Shelf', color: 'bg-green-500', textColor: 'text-green-500' },
		{
			max: 8,
			label: "Connoisseur's Choice",
			color: 'bg-emerald-500',
			textColor: 'text-emerald-500',
		},
		{ max: 9, label: "Bartender's Favorite", color: 'bg-blue-500', textColor: 'text-blue-500' },
		{ max: 10, label: 'Best in House', color: 'bg-violet-500', textColor: 'text-violet-500' },
	];

	// Calculate score
	const score = calculateOverallScore(
		recipe.recipeVersatilityRating,
		recipe.recipeSweetnessRating,
		recipe.recipeDrynessRating,
		recipe.recipeStrengthRating
	);

	const rating = ratingsMap.find(({ max }) => score <= max) || ratingsMap[ratingsMap.length - 1];

	// Calculate ABV
	const abv = calculateAbv(recipeSteps, recipe.recipeTechniqueDescriptionId || 1);

	// Rating items for display
	const ratingItems = [
		{ label: 'Sweetness', value: recipe.recipeSweetnessRating, icon: Candy, color: 'pink' },
		{ label: 'Dryness', value: recipe.recipeDrynessRating, icon: Droplets, color: 'amber' },
		{
			label: 'Versatility',
			value: recipe.recipeVersatilityRating,
			icon: Sparkles,
			color: 'purple',
		},
		{ label: 'Strength', value: recipe.recipeStrengthRating, icon: Gauge, color: 'orange' },
	];

	const colorClasses: Record<string, { bar: string; icon: string }> = {
		pink: { bar: 'bg-pink-500', icon: 'text-pink-500' },
		amber: { bar: 'bg-amber-500', icon: 'text-amber-500' },
		purple: { bar: 'bg-purple-500', icon: 'text-purple-500' },
		orange: { bar: 'bg-orange-500', icon: 'text-orange-500' },
	};
</script>

<Card.Root class={cn('overflow-hidden', className)} {...restProps}>
	<Card.Header class="pb-3">
		<Card.Title class="flex items-center gap-2 text-lg">
			<Award class="h-5 w-5 text-primary" />
			Verdict
		</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-6">
		<!-- Score display -->
		<div class="flex items-center gap-4">
			<!-- Big score badge -->
			<div
				class={cn(
					'w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shadow-lg',
					rating.color
				)}
			>
				<span class="text-2xl font-bold">{score.toFixed(1)}</span>
			</div>

			<!-- Rating info -->
			<div class="flex-1">
				<p class={cn('text-lg font-semibold', rating.textColor)}>
					{rating.label}
				</p>
				<p class="text-sm text-muted-foreground mt-0.5">
					{abv}
				</p>
			</div>
		</div>

		<!-- Rating bars -->
		<div class="space-y-3">
			{#each ratingItems as item}
				{@const colors = colorClasses[item.color]}
				{@const percentage = (item.value / 10) * 100}
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<item.icon class={cn('h-4 w-4', colors.icon)} />
							<span class="text-sm font-medium">{item.label}</span>
						</div>
						<span class="text-sm font-semibold text-muted-foreground">
							{item.value?.toFixed(1)}
						</span>
					</div>
					<div class="h-2 bg-muted rounded-full overflow-hidden">
						<div
							class={cn('h-full rounded-full transition-all duration-500', colors.bar)}
							style="width: {percentage}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
