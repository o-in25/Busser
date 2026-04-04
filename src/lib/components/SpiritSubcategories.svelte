<script lang="ts">
	import Autoplay from 'embla-carousel-autoplay';

	import type { AccentColor, SpiritSubcategory } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import { cn } from '$lib/utils';

	let {
		subcategories,
		accentColor,
	}: {
		subcategories: SpiritSubcategory[];
		accentColor: AccentColor;
	} = $props();

	const featured = $derived(subcategories[0]);
	const rest = $derived(subcategories.slice(1));

	let api: CarouselAPI | undefined = $state(undefined);
	let selectedIndex = $state(0);
	let scrollSnaps: number[] = $state([]);

	const reducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const autoplayPlugin = reducedMotion
		? []
		: [
				Autoplay({
					delay: 5000,
					stopOnInteraction: false,
					stopOnMouseEnter: true,
					stopOnFocusIn: true,
				}),
			];

	function onApiReady(newApi: CarouselAPI | undefined) {
		if (!newApi) return;
		api = newApi;
		scrollSnaps = newApi.scrollSnapList();
		selectedIndex = newApi.selectedScrollSnap();

		newApi.on('select', () => {
			selectedIndex = newApi.selectedScrollSnap();
		});
	}

	function scrollTo(index: number) {
		api?.scrollTo(index);
	}
</script>

<div>
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

	<!-- remaining subcategories -->
	{#if rest.length > 0}
		<div class="px-10">
			<Carousel.Root
				opts={{ loop: true, align: 'start' }}
				plugins={autoplayPlugin}
				setApi={onApiReady}
				class="w-full group/carousel"
			>
				<Carousel.Content class="-ml-4">
					{#each rest as sub, i}
						<Carousel.Item class="pl-4 basis-[75%] sm:basis-[45%] lg:basis-[33%]">
							<div
								class="glass-surface p-5 rounded-xl h-full border-t-2"
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
						</Carousel.Item>
					{/each}
				</Carousel.Content>

				<Carousel.Previous
					class="hidden sm:inline-flex bg-white/15 dark:bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/25 dark:hover:bg-white/15 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300"
				/>
				<Carousel.Next
					class="hidden sm:inline-flex bg-white/15 dark:bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/25 dark:hover:bg-white/15 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300"
				/>
			</Carousel.Root>
		</div>

		<!-- dot indicators -->
		<div class="flex justify-center gap-1.5 mt-4">
			{#each scrollSnaps as _, i}
				<button
					type="button"
					aria-label="Go to slide {i + 1}"
					class={cn(
						'carousel-dot',
						selectedIndex === i && 'carousel-dot-active'
					)}
					onclick={() => scrollTo(i)}
				></button>
			{/each}
		</div>
	{/if}
</div>
