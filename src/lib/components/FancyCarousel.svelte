<script lang="ts">
	import type { View } from '$lib/types';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import FancyCard from './FancyCard.svelte';
	import Autoplay from 'embla-carousel-autoplay';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import { cn } from '$lib/utils';

	let {
		recipes,
		class: className = '',
	}: {
		recipes: View.BasicRecipe[];
		class?: string;
	} = $props();

	let api: CarouselAPI | undefined = $state(undefined);
	let selectedIndex = $state(0);
	let scrollSnaps: number[] = $state([]);
	let slideProgress: number[] = $state(recipes.map(() => 0));

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

		newApi.on('scroll', () => {
			updateProgress();
		});

		// initial progress calc
		updateProgress();
	}

	function updateProgress() {
		if (!api) return;
		const engine = api.internalEngine();
		const scrollProgress = api.scrollProgress();
		const styles = api.scrollSnapList().map((snapPosition, index) => {
			let diff = snapPosition - scrollProgress;

			// handle loop wrapping
			if (engine.options.loop) {
				engine.slideLooper.loopPoints.forEach((loopItem: any) => {
					const target = loopItem.target();
					if (index === loopItem.index && target !== 0) {
						const sign = Math.sign(target);
						if (sign === -1) {
							diff = snapPosition - (1 + scrollProgress);
						}
						if (sign === 1) {
							diff = snapPosition + (1 - scrollProgress);
						}
					}
				});
			}

			// convert distance to 0-1 progress (1 = center, 0 = far away)
			const distance = Math.abs(diff);
			return Math.max(0, 1 - distance * 2.5);
		});

		slideProgress = styles;
	}

	function scrollTo(index: number) {
		api?.scrollTo(index);
	}

	const useFallback = $derived(recipes.length < 3);
</script>

{#if useFallback}
	<!-- static grid fallback for < 3 recipes -->
	<div class={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
		{#each recipes as recipe}
			<FancyCard {recipe} isActive={true} progress={1} />
		{/each}
	</div>
{:else}
	<div class={cn('w-full', className)}>
		<Carousel.Root
			opts={{ loop: true, align: 'center' }}
			plugins={autoplayPlugin}
			setApi={onApiReady}
			class="w-full group/carousel"
		>
			<Carousel.Content class="-ml-6 py-2">
				{#each recipes as recipe, i}
					<Carousel.Item
						class="pl-6 basis-[75%] sm:basis-[45%] lg:basis-[31%]"
					>
						<FancyCard
							{recipe}
							isActive={selectedIndex === i}
							progress={slideProgress[i] ?? 0}
						/>
					</Carousel.Item>
				{/each}
			</Carousel.Content>

			<!-- nav arrows (desktop only) -->
			<Carousel.Previous
				class="hidden sm:inline-flex left-4 bg-white/15 dark:bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/25 dark:hover:bg-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300"
			/>
			<Carousel.Next
				class="hidden sm:inline-flex right-4 bg-white/15 dark:bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/25 dark:hover:bg-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300"
			/>
		</Carousel.Root>

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
	</div>
{/if}
