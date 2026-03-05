<script lang="ts">
	import { Award, Candy, Droplets, Gauge, HelpCircle, Sparkles } from 'lucide-svelte';

	import * as Card from '$lib/components/ui/card';
	import * as Popover from '$lib/components/ui/popover';
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
		{ max: 3, label: 'Bottom Shelf', color: 'bg-neon-amber-500', textColor: 'text-neon-amber-500' },
		{ max: 4, label: 'Decent', color: 'bg-neon-yellow-500', textColor: 'text-neon-yellow-500' },
		{ max: 5, label: 'Standard Pour', color: 'bg-neon-yellow-400', textColor: 'text-neon-yellow-500' },
		{ max: 6, label: 'Good Stuff', color: 'bg-lime-500', textColor: 'text-lime-500' },
		{ max: 7, label: 'Top Shelf', color: 'bg-neon-green-500', textColor: 'text-neon-green-500' },
		{
			max: 8,
			label: "Connoisseur's Choice",
			color: 'bg-emerald-500',
			textColor: 'text-emerald-500',
		},
		{ max: 9, label: "Bartender's Favorite", color: 'bg-blue-500', textColor: 'text-blue-500' },
		{ max: 10, label: 'Best in House', color: 'bg-secondary-500', textColor: 'text-secondary-500' },
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
		{
			label: 'Sweetness',
			value: recipe.recipeSweetnessRating,
			icon: Candy,
			color: 'pink',
			tooltip: 'Sweetness is a measure of the sugar presence in the drink. Balanced cocktails sit in the middle — too much and it\'s cloying, too little and the drink feels flat. Scores best around a 5.',
		},
		{
			label: 'Dryness',
			value: recipe.recipeDrynessRating,
			icon: Droplets,
			color: 'amber',
			tooltip: 'Dryness is a measure of bitterness, tartness, and astringency. A good cocktail usually has some edge to it, but going overboard in either direction costs points. Scores best around a 5.',
		},
		{
			label: 'Versatility',
			value: recipe.recipeVersatilityRating,
			icon: Sparkles,
			color: 'purple',
			tooltip: 'Versatility is a measure of how flexible a recipe is — can its ingredients be freely substituted, and does it lend itself to variations? This is the most important factor and the higher the better.',
		},
		{
			label: 'Strength',
			value: recipe.recipeStrengthRating,
			icon: Gauge,
			color: 'orange',
			tooltip: 'Strength is a measure of how well the alcohol integrates with the other flavors — not just how much is in the glass. The spirit should be present but never overpowering. Scores best around a 6.',
		},
	];

	const colorClasses: Record<string, { bar: string; icon: string }> = {
		pink: { bar: 'bg-primary-500', icon: 'text-primary-500' },
		amber: { bar: 'bg-neon-amber-500', icon: 'text-neon-amber-500' },
		purple: { bar: 'bg-secondary-500', icon: 'text-secondary-500' },
		orange: { bar: 'bg-neon-amber-500', icon: 'text-neon-amber-500' },
	};
</script>

<Card.Root class={cn('overflow-hidden', className)} {...restProps}>
	<Card.Header class="pb-3">
		<Card.Title class="flex items-center gap-2 text-lg">
			<Award class="h-5 w-5 text-primary" />
			Verdict
			<Popover.Root>
				<Popover.Trigger class="text-muted-foreground hover:text-foreground transition-colors rounded-full">
					<HelpCircle class="h-4 w-4" />
					<span class="sr-only">How is the verdict calculated?</span>
				</Popover.Trigger>
				<Popover.Content class="w-72 text-sm text-left" align="center">
					<p class="font-semibold mb-2">How the score works</p>
					<p class="text-muted-foreground mb-2">
						The verdict is a 0–10 score based on how well-rounded and approachable a cocktail is.
					</p>
					<ul class="text-muted-foreground space-y-1.5 text-xs">
						<li><span class="text-foreground font-medium">Versatility</span> matters most — crowd-pleasing drinks that work for any occasion score higher.</li>
						<li><span class="text-foreground font-medium">Sweetness, Dryness & Strength</span> reward balance — mid-range values score best, while extremes are penalized.</li>
					</ul>
					<p class="text-muted-foreground text-xs mt-2 border-t border-border/50 pt-2">
						Drinks with a purposeful sweet/dry contrast get a bonus. Contradictory or one-dimensional profiles lose points.
					</p>
				</Popover.Content>
			</Popover.Root>
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
							<Popover.Root>
								<Popover.Trigger class="text-muted-foreground/50 hover:text-muted-foreground transition-colors rounded-full">
									<HelpCircle class="h-3 w-3" />
								</Popover.Trigger>
								<Popover.Content class="w-60 text-xs" align="start">
									<p class="text-muted-foreground">{item.tooltip}</p>
								</Popover.Content>
							</Popover.Root>
						</div>
						<span class="text-sm font-semibold text-muted-foreground">
							{item.value.toFixed(1)}
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
