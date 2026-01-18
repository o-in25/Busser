<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { PageData } from './$types';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import {
		ChevronDown,
		Filter,
		XCircle,
		Plus,
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';

	import CatalogItem from '$lib/components/CatalogItem.svelte';
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let data: PageData;
	const permissions: string[] = getContext('permissions');
	let openDropdown: boolean = false;

	let searchField = '';
	let filterField = 'all';
	let dropdownOpen = false;

	let searchTerm = $page.url.searchParams.get('searchTerm') || '';

	const handleDropdownOpen = (category: string) => {
		filterField = category;
		dropdownOpen = false;
	};

	$: search = data.searchResult;
</script>

<svelte:head>
	<title>Browse Catalog - Busser</title>
</svelte:head>
<Breadcrumb
	name="Catalog"
	href="/catalog"
>
	<BreadcrumbItem name="Browse"></BreadcrumbItem>
</Breadcrumb>
<h2 class="text-3xl mb-4 flex flex-row justify-between font-extrabold">
	Browse Catalog
</h2>
<form
	method="GET"
	action="/catalog/browse"
	onsubmit={(e) => e.preventDefault()}
>
	<div class="md:px-4 py-2 md:py-4">
		<div class="flex my-2">
			<div class="relative">
				<DropdownMenu.Root bind:open={openDropdown}>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "rounded-e-none rounded-s-lg whitespace-nowrap border-e-0")}>
						<Filter class="w-4 h-4" />
						<ChevronDown class="w-4 h-4 transition-transform duration-200 {openDropdown ? 'rotate-180' : ''}" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-40 glass-dropdown">
						<DropdownMenu.Label>Sort By...</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							onclick={() => {
								openDropdown = false;
								goto('/catalog/browse');
							}}
							class="cursor-pointer"
						>
							All
						</DropdownMenu.Item>
						<DropdownMenu.Item
							onclick={() => {
								openDropdown = false;
								goto('/catalog/browse?productInStockQuantity=1');
							}}
							class="cursor-pointer"
						>
							Available
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<div class="relative flex-1 flex items-center">
				<Input
					type="search"
					class="flex gap-2 items-center py-2.5 {permissions.includes('edit_inventory')
						? 'rounded-none'
						: 'rounded-s-none rounded-e-lg'}"
					placeholder="Search..."
					name="searchTerm"
					bind:value={searchTerm}
				/>
				{#if searchTerm}
					<button
						type="button"
						onclick={() => {
							searchTerm = '';
							goto('/catalog/browse', { replaceState: false });
						}}
						class="absolute right-3 outline-hidden"
					>
						<XCircle class="w-5 h-5" />
					</button>
				{/if}
			</div>
			{#if permissions.includes('add_inventory')}
				<a
					class={cn(buttonVariants(), "!px-2.5 rounded-s-none")}
					href="/catalog/add"
				>
					<Plus class="w-5 h-5" />
				</a>
			{/if}
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
			{#each search as recipe}
				<CatalogItem {recipe} />
			{/each}
		</div>
	</div>
</form>
