<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { PageData } from './$types';
	import { ArrowRight } from 'lucide-svelte';
	import Excerpt from '$lib/components/Excerpt.svelte';

	export let data: PageData;
	const { spirits } = data.args;
</script>

<svelte:head>
	<title>Catalog - Busser</title>
</svelte:head>
<div class="mt-5 flex items-center justify-between gap-4">
	<h2 class="text-3xl font-extrabold mb-4 w-auto">
		Catalog
	</h2>
	<a
		class="font-medium hover:underline flex items-center"
		href="/catalog/browse"
	>
		Browse entire catalog...
		<ArrowRight class="ms-1 h-5 w-5" />
	</a>
</div>
<div class="md:px-4 py-2 md:py-4">
	<div class="space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
			{#each spirits as spirit}
				<a href="/catalog/browse/{spirit.recipeCategoryId}" class="block">
					<Card.Root class="flex flex-row overflow-hidden hover:bg-accent transition-colors">
						<div class="w-1/3 shrink-0">
							<img
								src={spirit.recipeCategoryDescriptionImageUrl}
								alt={spirit.recipeCategoryDescription}
								class="h-full w-full object-cover"
							/>
						</div>
						<div class="p-4">
							<h5 class="mb-2 text-2xl font-bold tracking-tight">
								{spirit.recipeCategoryDescription}
							</h5>
							<p class="mb-3 font-normal text-muted-foreground leading-tight">
								{spirit.recipeCategoryDescriptionText}
							</p>
						</div>
					</Card.Root>
				</a>
			{/each}
		</div>
	</div>
</div>
<Excerpt />
