<script lang="ts">
	import { Award, Candy, Droplets, Gauge, HelpCircle, Sparkles } from 'lucide-svelte';

	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
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
		{
			max: 5,
			label: 'Standard Pour',
			color: 'bg-neon-yellow-400',
			textColor: 'text-neon-yellow-500',
		},
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
			tooltip:
				'Sweetness is a measure of the sugar presence in the drink. Most cocktails (with some noteworthy exceptions) will feature some form of sugaring agent or sweetening modifier to bring brightness and pop to the drink. It is a delicate manuever, however: too much lends to a cloying, spiked punch; too little and all the beverage has been reduced to is just a shot of spirts on the rocks; balanced cocktails find a strike a perfect harmony.',
		},
		{
			label: 'Dryness',
			value: recipe.recipeDrynessRating,
			icon: Droplets,
			color: 'amber',
			tooltip:
				'Dryness is a measure of bitterness, tartness, and astringency. Dryness can be thought of as the opposing force to sweetness and well-groomed cocktails usually have a counter-punch to bite through some of the sugar contents. Going overboard, however, saps the life and brightness out of the drink.',
		},
		{
			label: 'Strength',
			value: recipe.recipeStrengthRating,
			icon: Gauge,
			color: 'orange',
			tooltip:
				'Strength is a measure of how well the alcohol integrates with the other flavors, not just how much of it is in the glass. Regardless of volume, the base spirit should be present in the drink while never overstaying its welcome. Flavoring and bittering agents mask the harshness of alcohol but its breadcrumbs left behind should be noticeably apparent.',
		},
		{
			label: 'Versatility',
			value: recipe.recipeVersatilityRating,
			icon: Sparkles,
			color: 'purple',
			tooltip:
				'Versatility is a measure of how flexible a recipe is — and is the most important factor in the Verdict. Highly versatile drinks have ingredients comprised of several interchangeable parts or have countless deviations or spin-offs that can be easily substituted. While not necessarily always the case, cocktails with relatively few ingredients will typically be more versatile than drinks that require several niche or specialty ingredients. While these cocktails absolutely deserve merit on their own accord, flexibility of ingredients is vital for tending bar and thus caries the heaviest weight.',
		},
	];

	const colorClasses: Record<string, { bar: string; icon: string }> = {
		pink: { bar: 'bg-primary-500', icon: 'text-primary-500' },
		amber: { bar: 'bg-neon-amber-500', icon: 'text-neon-amber-500' },
		purple: { bar: 'bg-secondary-500', icon: 'text-secondary-500' },
		orange: { bar: 'bg-neon-amber-500', icon: 'text-neon-amber-500' },
	};
</script>

<Card.Root class={cn(className)} {...restProps}>
	<Card.Header class="pb-3">
		<Card.Title class="flex items-center gap-2 text-lg">
			<Award class="h-5 w-5 text-primary" />
			Verdict
			<Dialog.Root>
				<Dialog.Trigger
					class="text-muted-foreground hover:text-foreground transition-colors rounded-full"
				>
					<HelpCircle class="h-4 w-4" />
					<span class="sr-only">How is the Verdict calculated?</span>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title class="flex items-center gap-2">
							<Award class="h-5 w-5 text-primary" />
							How the Verdict works
						</Dialog.Title>
						<Dialog.Description class="text-muted-foreground">
							The Verdict is a 0–10 score that reflects how well-crafted and balanced a cocktail is.
						</Dialog.Description>
					</Dialog.Header>
					<div class="space-y-4">
						{#each ratingItems as item}
							{@const colors = colorClasses[item.color]}
							<div class="flex items-start gap-3">
								<div class="mt-0.5 shrink-0">
									<item.icon class={cn('h-4 w-4', colors.icon)} />
								</div>
								<div>
									<p class="text-sm font-medium">{item.label}</p>
									<p class="text-sm text-muted-foreground">{item.tooltip}</p>
								</div>
							</div>
						{/each}
					</div>
					<p class="text-xs text-muted-foreground border-t border-border/50 pt-3 mt-4">
						Cocktails with intentional sweet/dry contrast earn a bonus. One-dimensional or
						contradictory profiles lose points.
					</p>
				</Dialog.Content>
			</Dialog.Root>
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
