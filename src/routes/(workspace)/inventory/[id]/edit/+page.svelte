<script lang="ts">
	import type { PageData } from './$types';
	import InventoryForm from '$lib/components/InventoryForm.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Edit {data.product.productName} - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<a href="/inventory" class={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">Edit Product</h1>
			<p class="text-muted-foreground">Update {data.product.productName}</p>
		</div>
	</div>

	<InventoryForm action="edit" product={data.product} />
</div>
