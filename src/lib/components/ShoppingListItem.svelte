<script lang="ts">
	import { Flame, FlaskConical } from 'lucide-svelte';

	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { cn } from '$lib/utils';
	import type { ShoppingListItem } from '$lib/types';

	let {
		item,
		checked = false,
		onToggle,
	}: {
		item: ShoppingListItem;
		checked?: boolean;
		onToggle: (productId: number, checked: boolean) => void;
	} = $props();

	// 1-3 flame level based on impact score
	const impactLevel = $derived(
		item.unlockableRecipes >= 3 ? 3 : item.unlockableRecipes >= 1 ? item.unlockableRecipes : 0
	);
</script>

<div
	class={cn(
		'flex items-center gap-3 p-3 rounded-lg border bg-background/80 transition-all duration-300 group',
		checked && 'opacity-50 scale-[0.98]'
	)}
>
	<Checkbox
		checked={checked}
		onCheckedChange={(v) => onToggle(item.productId, !!v)}
		class="shrink-0"
	/>

	<SkeletonImage
		src={item.productImageUrl}
		alt={item.productName}
		variant="product"
		class="w-10 h-10 rounded shrink-0"
	/>

	<div class="flex-1 min-w-0">
		<p class={cn('font-medium truncate transition-all', checked && 'line-through')}>
			{item.productName}
		</p>
		<div class="flex items-center gap-2 mt-0.5">
			<Badge variant="secondary" class="text-[10px] px-1.5 py-0">
				{item.categoryName}
			</Badge>
			{#if item.recipeCount > 0}
				<span class="flex items-center gap-1 text-[10px] text-muted-foreground">
					<FlaskConical class="h-3 w-3" />
					{item.recipeCount}
				</span>
			{/if}
		</div>
	</div>

	<div class="flex items-center gap-3 shrink-0">
		<!-- impact flames -->
		{#if impactLevel > 0}
			<div class="flex items-center gap-0.5" title="Unlocks {item.unlockableRecipes} recipe(s)">
				{#each Array(impactLevel) as _}
					<Flame
						class={cn(
							'h-3.5 w-3.5',
							impactLevel === 3
								? 'text-red-500'
								: impactLevel === 2
									? 'text-orange-500'
									: 'text-yellow-500'
						)}
					/>
				{/each}
			</div>
		{/if}

		{#if item.productPricePerUnit > 0}
			<span class="text-sm font-medium tabular-nums">
				${item.productPricePerUnit.toFixed(2)}
			</span>
		{/if}
	</div>
</div>
