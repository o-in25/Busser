<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import SupplierForm from '$lib/components/SupplierForm.svelte';
</script>

<svelte:head>
	<title>Add Supplier - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-2xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback="/inventory/suppliers" />
		<div>
			<h1 class="text-2xl font-bold">Add New Supplier</h1>
			<p class="text-muted-foreground">Find a store nearby or enter the details yourself</p>
		</div>
	</div>

	<SupplierForm action="add" />
</div>
