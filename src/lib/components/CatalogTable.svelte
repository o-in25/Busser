<script lang="ts">
	import type { BasicRecipe } from '$lib/types';
	import {
		Card,
		Listgroup,
		ListgroupItem,
		Avatar,
		Alert,
	} from 'flowbite-svelte';
	export let recipes: BasicRecipe[];
	import placeholder from '$lib/assets/placeholder@2x.jpg';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
</script>

<Card
	padding="xl"
	size="xl"
	class="mx-auto"
>
	<!-- search -->

	<Listgroup class="border-0 dark:!bg-transparent">
		{#each recipes as recipe}
			<ListgroupItem
				active
				href="/catalog/{recipe.recipeId}"
			>
				<div class="flex items-center space-x-4 rtl:space-x-reverse">
					<Avatar
						src={recipe.recipeImageUrl || placeholder || ''}
						alt={recipe.recipeDescription || ''}
						class="flex-shrink-1"
					/>
					<div class="flex-1 min-w-0">
						<p
							class="text-sm font-medium text-gray-900 truncate dark:text-white block"
						>
							{recipe.recipeName}
							<span
								class="block text-sm font-light text-gray-500 dark:text-gray-400"
							>
								{recipe.recipeCategoryDescription}
							</span>
						</p>
						<p class="text-sm text-gray-500 truncate dark:text-gray-400">
							{recipe.recipeDescription}
						</p>
					</div>
					<!-- <Rating id="example-3" total={5} rating={3.4}>
            <p slot="text" class="ms-2 text-sm font-medium text-gray-500 dark:text-gray-400">3.4 out of 5</p>
          </Rating> -->
				</div>
			</ListgroupItem>
		{/each}
		{#if !recipes.length}
			<div class="flex flex-col items-center space-x-4">
				<Alert color="dark">
					<InfoCircleSolid slot="icon" />
					No Results
				</Alert>
			</div>
		{/if}
	</Listgroup>
</Card>
