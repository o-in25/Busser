<script lang="ts">
	import { EllipsisVertical, Trash2 } from 'lucide-svelte';

	import BackButton from '$lib/components/BackButton.svelte';
	import CatalogForm from '$lib/components/CatalogForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let modalOpen = $state(false);
</script>

<svelte:head>
	<title>Edit {data.recipe.recipeName} - Catalog</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback="/catalog/{data.recipe.recipeId}" />
		<div>
			<h1 class="text-2xl font-bold">Edit Recipe</h1>
			<p class="text-muted-foreground">Update {data.recipe.recipeName}</p>
		</div>
		<div class="ml-auto">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="outline" size="icon">
						<EllipsisVertical class="h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Item
						class="text-destructive data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10"
						onclick={() => (modalOpen = true)}
					>
						<Trash2 class="h-4 w-4 mr-2" />
						Delete Recipe
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<CatalogForm
		spirits={data.spirits}
		preparationMethods={data.preparationMethods}
		recipe={data.recipe}
		recipeSteps={data.recipeSteps}
		bind:modalOpen
	/>
</div>
