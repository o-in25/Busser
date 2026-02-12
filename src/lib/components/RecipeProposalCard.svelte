<script lang="ts">
	import { Check, ChefHat, Package, Plus, X } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	import type { RecipeProposal } from '$lib/types/assistant';

	interface Props {
		proposal: RecipeProposal;
		onconfirm: () => void;
		oncancel: () => void;
		isConfirming?: boolean;
	}

	let { proposal, onconfirm, oncancel, isConfirming = false }: Props = $props();
</script>

<div class="rounded-xl border bg-card p-4 space-y-4">
	<!-- Header -->
	<div class="flex items-start gap-3">
		<div class="p-2 rounded-lg bg-violet-500/10">
			<ChefHat class="h-5 w-5 text-violet-500" />
		</div>
		<div class="flex-1 min-w-0">
			<h4 class="font-semibold text-base">{proposal.recipeName}</h4>
			<p class="text-sm text-muted-foreground mt-0.5">{proposal.recipeDescription}</p>
		</div>
	</div>

	<!-- Meta -->
	<div class="flex flex-wrap gap-2">
		<Badge variant="secondary">{proposal.recipeCategoryName}</Badge>
		<Badge variant="outline">{proposal.preparationMethodName}</Badge>
	</div>

	<!-- Ratings -->
	<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
		<div class="flex justify-between">
			<span class="text-muted-foreground">Sweetness</span>
			<span>{proposal.ratings.sweetness}/10</span>
		</div>
		<div class="flex justify-between">
			<span class="text-muted-foreground">Dryness</span>
			<span>{proposal.ratings.dryness}/10</span>
		</div>
		<div class="flex justify-between">
			<span class="text-muted-foreground">Strength</span>
			<span>{proposal.ratings.strength}/10</span>
		</div>
		<div class="flex justify-between">
			<span class="text-muted-foreground">Versatility</span>
			<span>{proposal.ratings.versatility}/10</span>
		</div>
	</div>

	<Separator />

	<!-- Ingredients -->
	{#if proposal.ingredients.length > 0}
		<div class="space-y-2">
			<h5 class="text-sm font-medium flex items-center gap-1.5">
				<Package class="h-3.5 w-3.5" />
				Ingredients from inventory
			</h5>
			<ul class="space-y-1.5">
				{#each proposal.ingredients as ingredient}
					<li class="flex items-center gap-2 text-sm">
						<Check class="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
						<span class="flex-1">{ingredient.description}</span>
						<Badge variant="outline" class="text-xs"
							>{ingredient.matchMode === 'EXACT_PRODUCT'
								? ingredient.productName
								: ingredient.matchMode === 'ANY_IN_CATEGORY'
									? `Any ${ingredient.categoryName}`
									: `Any ${ingredient.categoryName}`}</Badge
						>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Missing Ingredients -->
	{#if proposal.missingIngredients.length > 0}
		<div class="space-y-2">
			<h5 class="text-sm font-medium flex items-center gap-1.5 text-amber-600">
				<Plus class="h-3.5 w-3.5" />
				Will be added to inventory
			</h5>
			<ul class="space-y-1.5">
				{#each proposal.missingIngredients as ingredient}
					<li class="flex items-center gap-2 text-sm">
						<Plus class="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
						<span class="flex-1">{ingredient.description}</span>
						<Badge variant="secondary" class="text-xs">{ingredient.categoryName}</Badge>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<Separator />

	<!-- Actions -->
	<div class="flex gap-2 justify-end">
		<Button variant="outline" size="sm" onclick={oncancel} disabled={isConfirming}>
			<X class="h-3.5 w-3.5 mr-1" />
			Cancel
		</Button>
		<Button size="sm" onclick={onconfirm} disabled={isConfirming}>
			{#if isConfirming}
				<span
					class="inline-block w-3.5 h-3.5 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin"
				></span>
				Creating...
			{:else}
				<Check class="h-3.5 w-3.5 mr-1" />
				Confirm & Create
			{/if}
		</Button>
	</div>
</div>
