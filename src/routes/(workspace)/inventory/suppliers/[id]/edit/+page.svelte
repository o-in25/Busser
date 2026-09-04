<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import SupplierForm from '$lib/components/SupplierForm.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Edit {data.supplier.supplierName} - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-2xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback="/inventory/suppliers" />
		<div>
			<h1 class="text-2xl font-bold">Edit Supplier</h1>
			<p class="text-muted-foreground">Update {data.supplier.supplierName}</p>
		</div>
	</div>

	<SupplierForm action="edit" supplier={data.supplier} />
</div>
