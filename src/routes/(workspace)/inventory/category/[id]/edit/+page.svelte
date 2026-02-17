<script lang="ts">
	import { EllipsisVertical, Trash2 } from 'lucide-svelte';

	import BackButton from '$lib/components/BackButton.svelte';
	import CategoryForm from '$lib/components/CategoryForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let modalOpen = $state(false);
</script>

<svelte:head>
	<title>Edit {data.category.categoryName} - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-2xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback="/inventory/category" />
		<div>
			<h1 class="text-2xl font-bold">Edit Category</h1>
			<p class="text-muted-foreground">Update {data.category.categoryName}</p>
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
						disabled={data.productCount > 0}
						onclick={() => (modalOpen = true)}
					>
						<Trash2 class="h-4 w-4 mr-2" />
						Delete Category
					</DropdownMenu.Item>
					{#if data.productCount > 0}
						<p class="px-2 py-1 text-xs text-muted-foreground">
							Remove {data.productCount} product{data.productCount !== 1 ? 's' : ''} first
						</p>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<CategoryForm
		action="edit"
		category={data.category}
		parentCategories={data.parentCategories}
		categoryGroups={data.categoryGroups}
		productCount={data.productCount}
		bind:modalOpen
	/>
</div>
