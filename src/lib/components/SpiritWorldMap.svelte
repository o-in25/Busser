<script lang="ts">
	import { geoNaturalEarth1, geoPath } from 'd3-geo';
	import * as topojson from 'topojson-client';
	import worldData from 'world-atlas/countries-50m.json';

	import type { AccentColor, SpiritRegion } from '$lib/types';

	let {
		regions,
		accentColor,
	}: {
		regions: SpiritRegion[];
		accentColor: AccentColor;
	} = $props();

	let hoveredRegion = $state<string | null>(null);

	// map alpha-2 country codes to ISO 3166-1 numeric
	const alpha2ToNumeric: Record<string, string> = {
		US: '840', MX: '484', JM: '388', CU: '192', BB: '052',
		TT: '780', GY: '328', PE: '604', CL: '152', GB: '826',
		IE: '372', NL: '528', FR: '250', ES: '724', IT: '380',
		PL: '616', RU: '643', SE: '752', JP: '392',
	};

	const activeNumericIds = $derived(
		new Set(regions.map((r) => alpha2ToNumeric[r.countryCode]).filter(Boolean))
	);

	// reverse lookup: numeric id → alpha-2
	const numericToAlpha2 = Object.fromEntries(
		Object.entries(alpha2ToNumeric).map(([a2, num]) => [num, a2])
	);

	function regionName(numericId: string) {
		const a2 = numericToAlpha2[numericId];
		return regions.find((r) => r.countryCode === a2)?.name ?? '';
	}

	function regionHighlight(numericId: string) {
		const a2 = numericToAlpha2[numericId];
		return regions.find((r) => r.countryCode === a2)?.highlights[0] ?? '';
	}

	// projection and path generator
	const projection = geoNaturalEarth1().scale(160).translate([480, 250]);
	const pathGenerator = geoPath(projection);

	// extract geojson features from topojson
	const countries = topojson.feature(
		worldData as any,
		(worldData as any).objects.countries
	).features;

	// land outline for subtle border
	const land = topojson.mesh(worldData as any, (worldData as any).objects.land);
	const landPath = pathGenerator(land as any) ?? '';
</script>

<div class="hidden md:block relative">
	<svg viewBox="0 0 960 500" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
		<!-- land outline -->
		<path
			d={landPath}
			fill="none"
			stroke="currentColor"
			stroke-opacity="0.1"
			stroke-width="0.5"
		/>

		<!-- country fills -->
		{#each countries as country}
			{@const id = country.id}
			{@const d = pathGenerator(country) ?? ''}
			{@const active = activeNumericIds.has(id)}
			{@const hovered = hoveredRegion === id}
			{#if active}
				<path
					{d}
					fill={accentColor.hex}
					fill-opacity={hovered ? 0.7 : 0.4}
					stroke={accentColor.hex}
					stroke-opacity={hovered ? 0.9 : 0.5}
					stroke-width={hovered ? 1.5 : 0.5}
					class="transition-all duration-200 cursor-pointer"
					onmouseenter={() => (hoveredRegion = id)}
					onmouseleave={() => (hoveredRegion = null)}
					role="img"
					aria-label={regionName(id)}
				/>
			{:else}
				<path
					{d}
					fill="currentColor"
					fill-opacity="0.06"
					stroke="none"
				/>
			{/if}
		{/each}
	</svg>

	<!-- tooltip -->
	{#if hoveredRegion}
		{@const name = regionName(hoveredRegion)}
		{@const highlight = regionHighlight(hoveredRegion)}
		{#if name}
			<div
				class="absolute top-4 right-4 glass-surface px-3 py-2 text-sm pointer-events-none z-10"
			>
				<p class="font-semibold" style="color: {accentColor.hex}">{name}</p>
				<p class="text-muted-foreground text-xs">{highlight}</p>
			</div>
		{/if}
	{/if}
</div>
