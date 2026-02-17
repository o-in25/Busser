<script lang="ts">
	import { EllipsisVertical, Trash2 } from 'lucide-svelte';

	import BackButton from '$lib/components/BackButton.svelte';
	import InventoryForm from '$lib/components/InventoryForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let modalOpen = $state(false);
</script>

<svelte:head>
	<title>Edit {data.product.productName} - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback="/inventory" />
		<div>
			<h1 class="text-2xl font-bold">Edit Product</h1>
			<p class="text-muted-foreground">Update {data.product.productName}</p>
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
						Delete Product
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<InventoryForm action="edit" product={data.product} bind:modalOpen />
</div>
