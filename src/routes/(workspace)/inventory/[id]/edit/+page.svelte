<script lang="ts">
	import { EllipsisVertical, Trash2 } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import BackButton from '$lib/components/BackButton.svelte';
	import InventoryForm from '$lib/components/InventoryForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Switch } from '$lib/components/ui/switch';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let modalOpen = $state(false);

	// global-catalog curation: whether this product seeds into every new workspace
	let stockByDefault = $state(data.stockByDefault);
	let flagForm = $state<HTMLFormElement>();
</script>

<svelte:head>
	<title>Edit {data.product.productName} - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="hidden md:flex items-center gap-4 mb-6 mt-4">
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
						class="text-destructive dark:text-red-400 data-[highlighted]:text-destructive dark:data-[highlighted]:text-red-400 data-[highlighted]:bg-destructive/10"
						onclick={() => (modalOpen = true)}
					>
						<Trash2 class="h-4 w-4 mr-2" />
						Delete Product
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	{#if data.isGlobal}
		<div
			class="mb-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 shadow-sm"
		>
			<div>
				<p class="text-sm font-medium">Stock in new workspaces</p>
				<p class="text-xs text-muted-foreground">
					New bars start with this product already in stock.
				</p>
			</div>
			<form
				method="POST"
				action="?/toggleDefaultStock"
				bind:this={flagForm}
				use:enhance={({ formData }) => {
					formData.set('stockByDefault', String(stockByDefault));
					return async ({ result }) => {
						// optimistic — revert if the server rejected it
						if (result.type === 'failure') stockByDefault = !stockByDefault;
					};
				}}
			>
				<Switch
					checked={stockByDefault}
					onCheckedChange={(checked) => {
						stockByDefault = checked;
						flagForm?.requestSubmit();
					}}
				/>
			</form>
		</div>
	{/if}

	<InventoryForm action="edit" product={data.product} bind:modalOpen />
</div>
