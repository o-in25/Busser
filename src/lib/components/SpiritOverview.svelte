<script lang="ts">
	import { Lightbulb } from 'lucide-svelte';

	import type { AccentColor, SpiritOverview as OverviewType } from '$lib/types';

	let {
		overview,
		funFact,
		accentColor,
	}: {
		overview: OverviewType;
		funFact: string;
		accentColor: AccentColor;
	} = $props();

	const productionSteps = $derived(overview.production.split('\n\n'));
</script>

<section class="mb-12 relative">
	<!-- decorative blur orb -->
	<div
		class="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-[0.07] pointer-events-none"
		style="background: {accentColor.hex}"
	></div>

	<h2 class="text-2xl font-bold mb-6">History & Production</h2>

	<!-- history panel -->
	<div
		class="glass-surface p-6 md:p-8 rounded-xl mb-6 relative overflow-hidden"
	>
		<div
			class="absolute inset-0 opacity-[0.04] pointer-events-none"
			style="background: linear-gradient(135deg, {accentColor.hex}, transparent)"
		></div>
		<h3 class="text-lg font-semibold mb-4" style="color: {accentColor.hex}">History</h3>
		<div class="text-muted-foreground leading-relaxed md:columns-2 md:gap-8 space-y-4">
			{#each overview.history.split('\n\n') as paragraph}
				<p>{paragraph}</p>
			{/each}
		</div>
	</div>

	<!-- production timeline -->
	<div class="mb-6">
		<h3 class="text-lg font-semibold mb-4" style="color: {accentColor.hex}">How It's Made</h3>
		<div class="relative pl-8 space-y-6">
			<!-- vertical line -->
			<div
				class="absolute left-[11px] top-2 bottom-2 w-px opacity-20"
				style="background: {accentColor.hex}"
			></div>
			{#each productionSteps as step, i}
				<div class="relative">
					<!-- numbered dot -->
					<div
						class="absolute -left-8 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold text-white"
						style="background: {accentColor.hex}"
					>
						{i + 1}
					</div>
					<p class="text-muted-foreground leading-relaxed">{step}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- fun fact -->
	<div class="glass-card p-5 relative overflow-hidden">
		<div
			class="absolute inset-0 opacity-[0.04] pointer-events-none"
			style="background: linear-gradient(135deg, {accentColor.hex}, transparent)"
		></div>
		<div class="flex items-start gap-4 relative">
			<div
				class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
				style="background: {accentColor.hex}20"
			>
				<Lightbulb class="h-5 w-5" style="color: {accentColor.hex}" />
			</div>
			<div>
				<p class="font-semibold text-sm mb-1">Fun Fact</p>
				<p class="text-muted-foreground text-sm italic leading-relaxed">{funFact}</p>
			</div>
		</div>
	</div>
</section>
