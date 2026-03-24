<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import InventoryForm from '$lib/components/InventoryForm.svelte';
</script>

<svelte:head>
	<title>Add Product - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="hidden md:flex items-center gap-4 mb-3 mt-2 md:mb-6 md:mt-4">
		<BackButton fallback="/inventory" />
		<div>
			<h1 class="text-lg md:text-2xl font-bold">Add New Product</h1>
			<p class="text-muted-foreground hidden md:block">Add a new item to your inventory</p>
		</div>
	</div>

	<InventoryForm action="add" />
</div>
