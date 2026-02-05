<script lang="ts">
	import { Check, Layers, Sparkles } from 'lucide-svelte';
	import { convertFromMl, getUnits, topOffPresets } from '$lib/math';
	import type { MatchMode } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		class: className,
		stepNumber,
		categoryName,
		productName,
		quantity,
		unit,
		description,
		matchMode = 'EXACT_PRODUCT',
		parentCategoryName,
		checked = $bindable(false),
		...restProps
	}: {
		class?: string;
		stepNumber: number;
		categoryName: string;
		productName: string;
		quantity: number;
		unit: string;
		description?: string | null;
		matchMode?: MatchMode;
		parentCategoryName?: string | null;
		checked?: boolean;
		[key: string]: unknown;
	} = $props();

	const units = getUnits();
	const displayQuantity = $derived(convertFromMl(unit, quantity));
	const unitLabel = $derived(units[unit]?.i18n(displayQuantity) || unit);

	// Format the ingredient line based on unit type
	const formattedIngredient = $derived.by(() => {
		const unitLower = unit.toLowerCase();

		// "Top off" uses preset labels
		if (unitLower === 'top off') {
			const preset = topOffPresets.find((p) => p.ml === quantity);
			const presetLabel = preset?.label || 'Top off';
			return { prefix: `${presetLabel} with`, ingredient: categoryName };
		}

		// Countable discrete units - use space before unit, no "of"
		const countableUnits = ['dash', 'cube', 'barspoon', 'egg white', 'egg yolk', 'whole egg'];
		if (countableUnits.includes(unitLower)) {
			return { prefix: `${Math.round(displayQuantity)} ${unitLabel}`, ingredient: categoryName };
		}

		// Volumetric units (oz, ml, tsp, tbsp) - no space, no "of"
		return { prefix: `${displayQuantity}${unitLabel}`, ingredient: categoryName };
	});

	// Determine what to display based on match mode
	const isFlexible = $derived(matchMode !== 'EXACT_PRODUCT');
	const flexibleLabel = $derived.by(() => {
		if (matchMode === 'ANY_IN_CATEGORY') return `Any ${categoryName}`;
		if (matchMode === 'ANY_IN_PARENT_CATEGORY' && parentCategoryName)
			return `Any ${parentCategoryName}`;
		return null;
	});

	function handleToggle() {
		checked = !checked; // propagates to parent
	}
</script>

<button
	type="button"
	class={cn(
		'w-full flex items-start gap-3 p-4 rounded-lg transition-all duration-200 text-left group',
		checked
			? 'bg-primary/5 border border-primary/20'
			: 'bg-card border border-border hover:border-primary/30 hover:bg-accent/30',
		className
	)}
	onclick={handleToggle}
	{...restProps}
>
	<!-- Step number / Check indicator -->
	<div
		class={cn(
			'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
			checked
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
		)}
	>
		{#if checked}
			<Check class="w-4 h-4" />
		{:else}
			{stepNumber}
		{/if}
	</div>

	<!-- Content -->
	<div class="flex-1 min-w-0 space-y-1">
		<!-- Top line -->
		{#if checked}
			<s class="text-foreground font-semibold">
				{formattedIngredient.prefix}
				<span class="text-muted-foreground">{formattedIngredient.ingredient}</span>
			</s>
		{:else}
			<div class="text-foreground font-semibold">
				{formattedIngredient.prefix}
				<span class="text-muted-foreground">{formattedIngredient.ingredient}</span>
			</div>
		{/if}

		<!-- Product name with flexible matching indicator -->
		{#if isFlexible && flexibleLabel}
			<div class="flex items-center gap-1.5 mt-0.5">
				{#if matchMode === 'ANY_IN_PARENT_CATEGORY'}
					<Sparkles class="w-3 h-3 text-amber-500" />
				{:else}
					<Layers class="w-3 h-3 text-blue-500" />
				{/if}
				{#if checked}
					<s class="text-xs text-muted-foreground">{flexibleLabel}</s>
				{:else}
					<span class="text-xs text-muted-foreground">{flexibleLabel}</span>
				{/if}
			</div>
			{#if productName && productName !== categoryName}
				{#if checked}
					<s class="text-xs text-muted-foreground/60 mt-0.5 block">Using: {productName}</s>
				{:else}
					<p class="text-xs text-muted-foreground/60 mt-0.5">Using: {productName}</p>
				{/if}
			{/if}
		{:else if productName && productName !== categoryName}
			{#if checked}
				<s class="text-sm text-muted-foreground mt-0.5 block">{productName}</s>
			{:else}
				<p class="text-sm text-muted-foreground mt-0.5">{productName}</p>
			{/if}
		{/if}

		<!-- Description -->
		{#if description}
			{#if checked}
				<s class="text-xs text-muted-foreground/70 italic mt-1 block">{description}</s>
			{:else}
				<p class="text-xs text-muted-foreground/70 italic mt-1">{description}</p>
			{/if}
		{/if}
	</div>
</button>
