<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import CategoryForm from '$lib/components/CategoryForm.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Add Category - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-2xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback="/inventory/category" />
		<div>
			<h1 class="text-2xl font-bold">Add New Category</h1>
			<p class="text-muted-foreground">Create a new product category</p>
		</div>
	</div>

	<CategoryForm action="add" parentCategories={data.parentCategories} categoryGroups={data.categoryGroups} />
</div>
