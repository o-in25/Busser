<script lang="ts">
	import {
		BookOpen,
		ChefHat,
		Clock,
		FlaskConical,
		GlassWater,
		Grape,
		Lightbulb,
		RefreshCw,
		Sparkles,
		UtensilsCrossed,
	} from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { CollapsibleSection } from '$lib/components/ui/collapsible';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { RecipeInsightsOutput } from '$lib/types/generators';

	let {
		content,
		loading = false,
	}: {
		content: RecipeInsightsOutput | null;
		loading?: boolean;
	} = $props();
</script>

{#if loading}
	<div class="space-y-6">
		<Card.Root>
			<Card.Content class="pt-6 space-y-3">
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-3/4" />
			</Card.Content>
		</Card.Root>
	</div>
{:else if content}
	<div class="space-y-4">
		<!-- History & Origin -->
		<CollapsibleSection title="History & Origin" icon={BookOpen} open={true}>
			<p class="text-muted-foreground leading-relaxed">{content.history}</p>
		</CollapsibleSection>

		<!-- Flavor Profile & Why It Works -->
		<CollapsibleSection title="Flavor Profile" icon={Sparkles} open={true}>
			<div class="space-y-4">
				<p class="text-muted-foreground leading-relaxed">{content.flavorProfile}</p>
				<div class="p-3 rounded-lg bg-primary/5 border border-primary/10">
					<p class="text-sm">
						<span class="font-medium text-primary">Why it works:</span>
						<span class="text-muted-foreground ml-1">{content.whyItWorks}</span>
					</p>
				</div>
			</div>
		</CollapsibleSection>

		<!-- Pro Tips -->
		<CollapsibleSection title="Pro Tips" icon={Lightbulb} open={false}>
			<ul class="space-y-2">
				{#each content.proTips as tip}
					<li class="flex items-start gap-2">
						<ChefHat class="h-4 w-4 text-primary mt-0.5 shrink-0" />
						<span class="text-sm text-muted-foreground">{tip}</span>
					</li>
				{/each}
			</ul>
		</CollapsibleSection>

		<!-- Substitutions -->
		<CollapsibleSection title="Substitutions" icon={RefreshCw} open={false}>
			<div class="space-y-3">
				{#each content.substitutions as sub}
					<div class="p-3 rounded-lg bg-muted/30 border">
						<div class="flex items-center gap-2 mb-1">
							<Badge variant="outline" class="text-xs">{sub.ingredient}</Badge>
							<span class="text-muted-foreground text-xs">→</span>
							<Badge variant="secondary" class="text-xs">{sub.substitute}</Badge>
						</div>
						<p class="text-xs text-muted-foreground">{sub.note}</p>
					</div>
				{/each}
			</div>
		</CollapsibleSection>

		<!-- Glassware & Garnish -->
		<CollapsibleSection title="Glassware & Garnish" icon={GlassWater} open={false}>
			<div class="space-y-4">
				<div>
					<h4 class="text-sm font-medium mb-1">Glassware</h4>
					<p class="text-sm text-muted-foreground">{content.glassware}</p>
				</div>
				<div>
					<h4 class="text-sm font-medium mb-2">Garnish Options</h4>
					<div class="flex flex-wrap gap-2">
						{#each content.garnish as garnish}
							<Badge variant="outline">{garnish}</Badge>
						{/each}
					</div>
				</div>
			</div>
		</CollapsibleSection>

		<!-- Food Pairings -->
		<CollapsibleSection title="Food Pairings" icon={UtensilsCrossed} open={false}>
			<div class="flex flex-wrap gap-2">
				{#each content.foodPairings as pairing}
					<Badge variant="secondary">{pairing}</Badge>
				{/each}
			</div>
		</CollapsibleSection>

		<!-- Occasion -->
		<CollapsibleSection title="When to Serve" icon={Clock} open={false}>
			<p class="text-muted-foreground">{content.occasion}</p>
		</CollapsibleSection>

		<!-- Variations -->
		<CollapsibleSection title="Variations & Riffs" icon={FlaskConical} open={false}>
			<div class="space-y-3">
				{#each content.variations as variation}
					<div class="p-3 rounded-lg bg-muted/30 border">
						<h4 class="font-medium text-sm mb-1">{variation.name}</h4>
						<p class="text-xs text-muted-foreground">{variation.description}</p>
					</div>
				{/each}
			</div>
		</CollapsibleSection>

		<!-- Similar Cocktails -->
		<CollapsibleSection title="If You Like This, Try..." icon={Grape} open={false}>
			<div class="flex flex-wrap gap-2">
				{#each content.similarCocktails as cocktail}
					<Badge variant="outline">{cocktail}</Badge>
				{/each}
			</div>
		</CollapsibleSection>
	</div>
{:else}
	<Card.Root>
		<Card.Content class="pt-6">
			<p class="text-muted-foreground italic text-center py-4">
				No additional information available for this cocktail.
			</p>
		</Card.Content>
	</Card.Root>
{/if}
