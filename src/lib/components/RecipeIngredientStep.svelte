<script lang="ts">
	import { Check } from 'lucide-svelte';
	import { convertFromMl, getUnits } from '$lib/math';
	import { cn } from '$lib/utils';

	let {
		class: className,
		stepNumber,
		categoryName,
		productName,
		quantity,
		unit,
		description,
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
		checked?: boolean;
		[key: string]: unknown;
	} = $props();

	const units = getUnits();
	const displayQuantity = $derived(convertFromMl(unit, quantity));
	const unitLabel = $derived(units[unit]?.i18n(quantity) || unit);

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
				{displayQuantity}{unitLabel} <span class="text-muted-foreground">of</span>
				{categoryName}
			</s>
		{:else}
			<div class="text-foreground font-semibold">
				{displayQuantity}{unitLabel} <span class="text-muted-foreground">of</span>
				{categoryName}
			</div>
		{/if}

		<!-- Product name -->
		{#if productName && productName !== categoryName}
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
