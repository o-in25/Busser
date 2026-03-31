<script lang="ts">
	import type { View } from '$lib/types';
	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { cn } from '$lib/utils';

	let {
		recipe,
		isActive = false,
		progress = 1,
		class: className = '',
	}: {
		recipe: View.BasicRecipe;
		isActive?: boolean;
		progress?: number;
		class?: string;
	} = $props();

	const flavorBadges = $derived.by(() => {
		const badges: string[] = [];
		if (recipe.recipeSweetnessRating >= 6) badges.push('Sweet');
		if (recipe.recipeDrynessRating >= 6) badges.push('Dry');
		if (recipe.recipeStrengthRating >= 6) badges.push('Strong');
		if (recipe.recipeVersatilityRating >= 6) badges.push('Versatile');
		return badges.slice(0, 3);
	});

	const scale = $derived(0.95 + 0.1 * progress);

	const reducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<a
	href="/catalog/{recipe.recipeId}"
	class={cn(
		'fancy-card group block rounded-2xl overflow-hidden relative',
		isActive && 'fancy-card-active',
		className
	)}
	style={reducedMotion
		? undefined
		: `transform: scale(${scale});`}
>
	<div class="aspect-[16/9] relative">
		<SkeletonImage
			src={recipe.recipeImageUrl}
			alt={recipe.recipeName}
			variant="recipe"
			class="h-full w-full group-hover:scale-105 transition-transform duration-500"
		/>

		<!-- gradient overlay -->
		<div
			class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
		></div>

		<!-- specular highlight -->
		<div class="fancy-card-specular"></div>

		<!-- spirit badge -->
		{#if recipe.recipeCategoryDescription}
			<Badge
				variant="secondary"
				class="absolute top-3 left-3 bg-white/15 dark:bg-white/10 backdrop-blur-md text-white text-xs border-white/20"
			>
				{recipe.recipeCategoryDescription}
			</Badge>
		{/if}

		<!-- bottom content -->
		<div class="absolute bottom-0 left-0 right-0 p-3">
			<p class="text-sm font-semibold text-white truncate">
				{recipe.recipeName}
			</p>

			<!-- flavor badges (reveal on hover) -->
			{#if flavorBadges.length > 0}
				<div
					class="flex gap-1.5 mt-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
				>
					{#each flavorBadges as badge}
						<span
							class="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 border border-white/10"
						>
							{badge}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</a>
