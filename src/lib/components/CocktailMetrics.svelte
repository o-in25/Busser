<script lang="ts">
	import { DollarSign, Droplets, FlaskConical, Percent } from 'lucide-svelte';

	import { CalculatedBadge } from '$lib/components/ui/calculated-badge';
	import { calculateAbv, convertToMl } from '$lib/math';
	import type { View } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		class: className,
		steps,
		recipeTechniqueDescriptionId = 1,
		...restProps
	}: {
		class?: string;
		steps: View.BasicRecipeStep[];
		recipeTechniqueDescriptionId?: number;
		[key: string]: unknown;
	} = $props();

	// Calculate total volume in oz
	let totalVolumeOz = $derived(
		steps.reduce((acc, step) => {
			const mlValue = convertToMl(step.productIdQuantityUnit, step.productIdQuantityInMilliliters);
			return acc + mlValue / 30; // Convert ml to oz
		}, 0)
	);

	// Calculate ABV using the existing function
	let abv = $derived(() => {
		// Convert steps to ml for the calculateAbv function
		const stepsInMl = steps.map((step) => ({
			productIdQuantityInMilliliters: convertToMl(
				step.productIdQuantityUnit,
				step.productIdQuantityInMilliliters
			),
			productProof: step.productProof || 0,
		}));

		// Only calculate if we have valid steps
		if (stepsInMl.some((s) => s.productIdQuantityInMilliliters > 0 && s.productProof > 0)) {
			return calculateAbv(stepsInMl, recipeTechniqueDescriptionId);
		}
		return '--% abv';
	});

	// Calculate estimated cost
	let estimatedCost = $derived(
		steps.reduce((acc, step) => {
			if (step.productUnitSizeInMilliliters > 0 && step.productPricePerUnit > 0) {
				const mlUsed = convertToMl(step.productIdQuantityUnit, step.productIdQuantityInMilliliters);
				const costPerMl = step.productPricePerUnit / step.productUnitSizeInMilliliters;
				return acc + mlUsed * costPerMl;
			}
			return acc;
		}, 0)
	);

	// Count of ingredients with a product selected
	let ingredientCount = $derived(steps.filter((s) => s.productId > 0).length);

	// Format helpers
	let displayVolume = $derived(totalVolumeOz > 0 ? totalVolumeOz.toFixed(1) : '--');
	let displayCost = $derived(estimatedCost > 0 ? `$${estimatedCost.toFixed(2)}` : '--');
	let displayCount = $derived(ingredientCount > 0 ? ingredientCount : '--');
</script>

<div
	class={cn('flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border border-border/50', className)}
	{...restProps}
>
	<CalculatedBadge label="ABV" value={abv()} icon={Percent} />

	<CalculatedBadge label="Volume" value={displayVolume} unit="oz" icon={Droplets} />

	<CalculatedBadge label="Est. Cost" value={displayCost} icon={DollarSign} />

	<CalculatedBadge label="Ingredients" value={displayCount} icon={FlaskConical} />
</div>
