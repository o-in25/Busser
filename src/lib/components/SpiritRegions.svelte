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

<section class="mb-12">
	<h2 class="text-2xl font-bold mb-6">Geographic Origins</h2>

	<SpiritWorldMap {regions} {accentColor} />

	<div class="bg-muted/30 rounded-xl p-4 md:p-6 mt-6">
		<div class="space-y-3">
			{#each regions as region, i}
				<div class="glass-card p-4 md:p-5 flex gap-4 items-start">
					<div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-muted/50 overflow-hidden">
						<img
							src="https://flagcdn.com/w80/{region.countryCode.toLowerCase()}.png"
							alt="{region.name} flag"
							class="w-full h-full object-cover"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold mb-1">{region.name}</h3>
						<p class="text-muted-foreground text-sm mb-2">{region.description}</p>
						<div class="flex flex-wrap gap-1.5">
							{#each region.highlights as highlight}
								<Badge variant="outline" class="text-xs">{highlight}</Badge>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
