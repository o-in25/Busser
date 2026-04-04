<script lang="ts">
	import SpiritWorldMap from '$lib/components/SpiritWorldMap.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import type { AccentColor, SpiritRegion } from '$lib/types';

	let {
		regions,
		accentColor,
	}: {
		regions: SpiritRegion[];
		accentColor: AccentColor;
	} = $props();
</script>

<div>
	<SpiritWorldMap {regions} {accentColor} />

	<div class="space-y-3 mt-6">
		{#each regions as region, i}
			<div class="glass-card p-4 md:p-5">
				<div class="flex items-center gap-3 mb-2">
					<div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-muted/50 overflow-hidden">
						<img
							src="https://flagcdn.com/w80/{region.countryCode.toLowerCase()}.png"
							alt="{region.name} flag"
							class="w-full h-full object-cover"
						/>
					</div>
					<h3 class="font-semibold">{region.name}</h3>
				</div>
				<p class="text-muted-foreground text-sm mb-2">{region.description}</p>
				<div class="flex flex-wrap gap-1.5">
					{#each region.highlights as highlight}
						<Badge variant="outline" class="text-xs">{highlight}</Badge>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
