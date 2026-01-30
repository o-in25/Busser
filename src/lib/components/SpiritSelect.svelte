<script lang="ts">
	import { onMount } from 'svelte';

	import { Label } from '$lib/components/ui/label';
	import type { Spirit } from '$lib/types';

	export let selected: string | number = 4;

	let spirits: Spirit[] = [];

	onMount(async () => {
		const result = await fetch('/api/select/spirits');
		const data = await result.json();
		spirits = data;
	});
</script>

<Label for="recipeCategoryId" class="mb-2">Category</Label>
<div
	class="grid gap-6 w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6"
>
	{#each spirits as spirit}
		<label class="w-full cursor-pointer">
			<input
				type="radio"
				name="recipeCategoryId"
				value={spirit.recipeCategoryId}
				bind:group={selected}
				class="sr-only peer"
			/>
			<div
				class="inline-flex justify-between items-center text-muted-foreground bg-background rounded-lg border border-input cursor-pointer peer-checked:border-primary peer-checked:text-primary hover:bg-accent transition-colors"
			>
				<div class="block">
					<div class="h-auto max-w-16 md:max-w-20 rounded">
						<img
							src={spirit.recipeCategoryDescriptionImageUrl}
							alt={spirit.recipeCategoryDescription}
							class="object-contain rounded"
						/>
					</div>
				</div>
				<div class="w-20 text-center p-0.5">
					<div class="w-full text-sm md:text-md font-semibold truncate">
						{spirit.recipeCategoryDescription}
					</div>
				</div>
			</div>
		</label>
	{/each}
</div>
