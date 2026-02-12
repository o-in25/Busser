<script lang="ts">
	import { Check, GlassWater, Martini, Sparkles, Wind } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { convertToMl, getDilutionInfo } from '$lib/math';
	import type { PreparationMethod, View } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		class: className,
		methods,
		value = $bindable<number>(),
		name = 'recipeTechniqueDescriptionId',
		variant = 'toggle',
		steps = [],
		onchange,
		...restProps
	}: {
		class?: string;
		methods: PreparationMethod[];
		value?: number;
		name?: string;
		variant?: 'toggle' | 'cards';
		steps?: View.BasicRecipeStep[];
		onchange?: (method: PreparationMethod) => void;
		[key: string]: unknown;
	} = $props();

	// convert steps to ml for dilution calculation
	const stepsInMl = $derived(
		steps.map((step) => ({
			productIdQuantityInMilliliters: convertToMl(
				step.productIdQuantityUnit,
				step.productIdQuantityInMilliliters
			),
			productProof: step.productProof || 0,
		}))
	);

	// calculate dilution for each method
	function getDilutionForMethod(methodId: number) {
		if (stepsInMl.length === 0 || !stepsInMl.some((s) => s.productIdQuantityInMilliliters > 0)) {
			return null;
		}
		const info = getDilutionInfo(stepsInMl, methodId);
		return info;
	}

	// Icon mapping for preparation methods
	const iconMap: Record<string, typeof Martini> = {
		Stirred: Martini,
		Shaken: GlassWater,
		Built: Wind,
		Blended: Sparkles,
	};

	let selectedMethod = $derived(methods.find((m) => m.recipeTechniqueDescriptionId === value));

	function handleSelect(method: PreparationMethod) {
		value = method.recipeTechniqueDescriptionId;
		onchange?.(method);
	}
</script>

<div class={cn('space-y-2', className)} {...restProps}>
	<input type="hidden" {name} {value} />

	{#if variant === 'cards'}
		<!-- Radio card variant -->
		<div class="grid grid-cols-1 gap-3">
			{#each methods as method}
				{@const isSelected = method.recipeTechniqueDescriptionId === value}
				{@const MethodIcon = iconMap[method.recipeTechniqueDescriptionText] || Martini}
				{@const dilution = getDilutionForMethod(method.recipeTechniqueDescriptionId)}

				<button
					type="button"
					class={cn(
						'relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
						isSelected
							? 'border-primary bg-primary/5'
							: 'border-border hover:border-primary/50 hover:bg-accent/50'
					)}
					onclick={() => handleSelect(method)}
				>
					<div
						class={cn(
							'flex items-center justify-center w-12 h-12 rounded-full shrink-0 overflow-hidden',
							isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
						)}
					>
						{#if method.recipeTechniqueDescriptionImageUrl}
							<img
								src={method.recipeTechniqueDescriptionImageUrl}
								alt={method.recipeTechniqueDescriptionText}
								class="w-full h-full object-cover"
							/>
						{:else}
							<MethodIcon class="h-6 w-6" />
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="font-medium">{method.recipeTechniqueDescriptionText}</div>
						{#if method.recipeTechniqueDescriptionInstructions}
							<div class="text-xs text-muted-foreground mt-1">
								{method.recipeTechniqueDescriptionInstructions}
							</div>
						{/if}
						{#if dilution && dilution.dilutionMl > 0}
							<div class="text-sm font-medium text-primary mt-2">
								+{dilution.dilutionOz.toFixed(2)}oz water added
							</div>
						{:else}
							<div class="text-sm text-muted-foreground mt-2">
								~{method.recipeTechniqueDilutionPercentage}% dilution
							</div>
						{/if}
					</div>
					{#if isSelected}
						<div
							class="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shrink-0"
						>
							<Check class="h-4 w-4" />
						</div>
					{/if}
				</button>
			{/each}
		</div>
	{:else}
		<!-- Toggle variant (default) -->
		<div class="grid grid-cols-2 sm:flex rounded-lg border border-input bg-card p-1 gap-1">
			{#each methods as method}
				{@const isSelected = method.recipeTechniqueDescriptionId === value}
				{@const MethodIcon = iconMap[method.recipeTechniqueDescriptionText] || Martini}

				<button
					type="button"
					class={cn(
						'sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200',
						isSelected
							? 'bg-primary text-primary-foreground shadow-sm'
							: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
					)}
					onclick={() => handleSelect(method)}
				>
					{#if method.recipeTechniqueDescriptionImageUrl}
						<img
							src={method.recipeTechniqueDescriptionImageUrl}
							alt={method.recipeTechniqueDescriptionText}
							class="h-5 w-5 rounded object-cover sm:hidden"
						/>
					{:else}
						<MethodIcon class="h-4 w-4 sm:hidden" />
					{/if}
					<span>{method.recipeTechniqueDescriptionText}</span>
				</button>
			{/each}
		</div>

		<!-- Dilution info badge (toggle only) -->
		{#if selectedMethod}
			<div class="flex items-center justify-center gap-2">
				<Badge variant="secondary" class="text-xs font-normal">
					<span class="text-foreground">Dilution:</span>
					<span class="ml-1 font-medium">{selectedMethod.recipeTechniqueDilutionPercentage}%</span>
				</Badge>
			</div>
		{/if}
	{/if}
</div>
