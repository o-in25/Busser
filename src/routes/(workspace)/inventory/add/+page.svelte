<script lang="ts">
	import type { PageData } from './$types';
	import InventoryForm from '$lib/components/InventoryForm.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Add Product - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<a href="/inventory" class={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">Add New Product</h1>
			<p class="text-muted-foreground">Add a new item to your inventory</p>
		</div>
	</div>

	<InventoryForm action="add" />
</div>
