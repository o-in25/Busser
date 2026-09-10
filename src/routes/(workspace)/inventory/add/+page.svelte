<script lang="ts">
	import InventoryForm from '$lib/components/InventoryForm.svelte';
</script>

<svelte:head>
	<title>Add Product - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<InventoryForm action="add" />
</div>
