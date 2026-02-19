<script lang="ts">
	import type { AccentColor, SpiritSubcategory } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';

	let {
		subcategories,
		accentColor,
	}: {
		subcategories: SpiritSubcategory[];
		accentColor: AccentColor;
	} = $props();

	const featured = $derived(subcategories[0]);
	const rest = $derived(subcategories.slice(1));
</script>

<section class="mb-12">
	<h2 class="text-2xl font-bold mb-6">Styles & Varieties</h2>

	<!-- featured first subcategory -->
	{#if featured}
		<div class="glass-card p-6 md:p-8 mb-6 relative overflow-hidden">
			<div
				class="absolute inset-0 opacity-[0.04] pointer-events-none"
				style="background: linear-gradient(135deg, {accentColor.hex}, transparent)"
			></div>
			<div class="relative">
				<Badge variant="secondary" class="mb-3 text-xs">Popular Style</Badge>
				<h3 class="font-semibold text-xl mb-2">{featured.name}</h3>
				<p class="text-muted-foreground mb-4">{featured.description}</p>
				<div class="flex flex-wrap gap-2">
					{#each featured.examples as example}
						<Badge variant="outline">{example}</Badge>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- remaining subcategories: horizontal scroll on mobile, grid on desktop -->
	{#if rest.length > 0}
		<div class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:snap-none md:pb-0">
			{#each rest as sub}
				<div
					class="glass-surface p-5 rounded-xl w-72 shrink-0 snap-start md:w-auto md:shrink border-t-2"
					style="border-color: {accentColor.hex}30"
				>
					<h3 class="font-semibold text-lg mb-2">{sub.name}</h3>
					<p class="text-muted-foreground text-sm mb-3">{sub.description}</p>
					<div class="flex flex-wrap gap-1.5">
						{#each sub.examples as example}
							<Badge variant="outline" class="text-xs">{example}</Badge>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
