<script lang="ts">
	import { DollarSign, Droplets, GlassWater, Percent } from 'lucide-svelte';

	import { CalculatedBadge } from '$lib/components/ui/calculated-badge';
	import { calculateAbv, convertToMl, getDilutionInfo } from '$lib/math';
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

	// Calculate dilution (water added) using getDilutionInfo
	let dilutionOz = $derived(() => {
		// convert steps to ml for the dilution calculation
		const stepsInMl = steps.map((step) => ({
			productIdQuantityInMilliliters: convertToMl(
				step.productIdQuantityUnit,
				step.productIdQuantityInMilliliters
			),
			productProof: step.productProof || 0,
		}));

		// only calculate if we have volume
		const totalVolume = stepsInMl.reduce((acc, s) => acc + s.productIdQuantityInMilliliters, 0);
		if (totalVolume <= 0) return 0;

		const info = getDilutionInfo(stepsInMl, recipeTechniqueDescriptionId);
		return info.dilutionOz;
	});

	// only surface metrics we actually have data for — a live "--" placeholder reads as broken.
	// abv() returns the '--% abv' sentinel when no step has proof; cost/dilution are 0 without data.
	let metrics = $derived(
		[
			abv() !== '--% abv'
				? { label: 'ABV', value: abv().replace('% abv', '%'), icon: Percent }
				: null,
			totalVolumeOz > 0
				? { label: 'Volume', value: totalVolumeOz.toFixed(1), unit: 'oz', icon: Droplets }
				: null,
			dilutionOz() > 0
				? { label: 'Dilution', value: `+${dilutionOz().toFixed(1)}`, unit: 'oz', icon: GlassWater }
				: null,
			estimatedCost > 0
				? { label: 'Est. Cost', value: `$${estimatedCost.toFixed(2)}`, icon: DollarSign }
				: null,
		].filter((m) => m !== null)
	);
</script>

{#if metrics.length > 0}
	<div
		class={cn(
			'grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/50',
			className
		)}
		{...restProps}
	>
		{#each metrics as metric}
			<CalculatedBadge
				label={metric.label}
				value={metric.value}
				unit={metric.unit}
				icon={metric.icon}
			/>
		{/each}
	</div>
{/if}
