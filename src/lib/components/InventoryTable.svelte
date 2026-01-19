<!-- TODO dispatch and handle in page file -->
<script lang="ts">
	import type { PaginationData, Product, Spirit } from '$lib/types';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Indicator } from '$lib/components/ui/indicator';
	import {
		Check,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		XCircle,
		Filter,
		Plus,
		Info,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import InventoryItem from './InventoryItem.svelte';

	export let products: Product[];
	export let paginationData: PaginationData;
	export let tableData: Spirit[];
	const permissions: string[] = getContext('permissions');

	let openRow: number | null;
	let openDropdown: boolean = false;

	const rowControl = (row: number) => (openRow = openRow === row ? null : row);

	const paginate = ({ total, perPage }: { total: number; perPage: number }) => {
		let range = Math.ceil(total / perPage);
		return [...Array(range)]
			.map((_, index) => index + 1)
			.map((page) => page.toString())
			.map((page) => {
				let href = `/inventory?page=${page}`;
				if (searchTerm) {
					href += `&productName=${searchTerm}`;
				}
				return {
					name: page,
					href,
					active: false,
				};
			});
	};

	$: search = products;
	$: activeUrl = $page.url.searchParams.get('page');
	$: pages = paginate(paginationData);

	$: urlParams_$ = $page.url.searchParams;
	let searchTerm = $page.url.searchParams.get('productName') || '';
	let direction: 'asc' | 'desc' | null;
	let form: HTMLFormElement;
	const regex = new RegExp(
		`\\b(${tableData.map(({ recipeCategoryDescription }) => recipeCategoryDescription.toLowerCase()).join('|')})\\b`,
		'i'
	);

	$: {
		if (!activeUrl) {
			const [first] = pages;
			if (first) {
				first.active = true;
			}
		} else {
			pages?.forEach((page) => {
				let queryString = page.href.split('?').slice(1).join('?');
				const params = new URLSearchParams(queryString);
				page.active = params.get('page') === activeUrl;
			});
			pages = pages;
		}
	}

	const navigate = (route: string, page: string | number) => {
		const urlParams = new URLSearchParams();
		urlParams.set('page', page.toString());
		Array.from(urlParams_$.entries()).forEach(([key, value]) => {
			if (key !== 'page') {
				urlParams.set(key, value);
			}
		});
		goto(`/${route}?${urlParams.toString()}`);
	};

	const isBaseSpirit = (categoryName: string) => regex.test(categoryName);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		let url = '/inventory';
		if (searchTerm !== '') {
			url = url.concat('?', `productName=${searchTerm}`);
			url = url.concat('&', `page=1`);
		} else {
			url = url.concat('?', `page=1`);
		}
		openRow = null;
		searchTerm = searchTerm;
		goto(url, { replaceState: true, invalidateAll: true });
	}
</script>

<form action="/inventory" method="GET" onsubmit={handleSubmit} bind:this={form}>
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
							goto('/inventory');
						}}
						class="cursor-pointer"
					>
						All
					</DropdownMenu.Item>
					<DropdownMenu.Item
						onclick={() => {
							openDropdown = false;
							goto('/inventory?productInStockQuantity=0');
						}}
						class="cursor-pointer"
					>
						Out of Stock
					</DropdownMenu.Item>
					<DropdownMenu.Item
						onclick={() => {
							openDropdown = false;
							goto('/inventory?productInStockQuantity=1');
						}}
						class="cursor-pointer"
					>
						In Stock
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>

		<div
			class="relative flex flex-1 items-center {permissions.includes('edit_inventory')
				? ''
				: 'rounded-s-none'}"
		>
			<Input
				type="search"
				placeholder="Search..."
				bind:value={searchTerm}
				class="rounded-none pr-10"
			/>
			{#if searchTerm}
				<button
					type="button"
					onclick={() => {
						searchTerm = '';
						goto('/inventory', { replaceState: true });
					}}
					class="absolute right-2 outline-none"
				>
					<XCircle class="w-5 h-5 text-muted-foreground hover:text-foreground" />
				</button>
			{/if}
		</div>
		{#if permissions.includes('add_inventory')}
			<a class={cn(buttonVariants(), "rounded-s-none")} href="/inventory/add">
				<Plus class="w-5 h-5" />
			</a>
		{/if}
	</div>

	<!-- table -->
	<div class="glass-table overflow-x-auto">
		<Table.Root>
			<Table.Header class="glass-table-header">
				<Table.Row>
					<Table.Head class="hidden sm:table-cell">Name</Table.Head>
					<Table.Head class="hidden sm:table-cell">Category</Table.Head>
					<Table.Head class="hidden sm:table-cell">Status</Table.Head>
					<Table.Head class="hidden sm:table-cell text-center">Base Spirit</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each search as product, row}
					<Table.Row
						onclick={() => rowControl(row)}
						class="cursor-pointer glass-table-row"
					>
						<Table.Cell>{product.productName}</Table.Cell>
						<Table.Cell class="hidden sm:table-cell">
							{product.categoryName}
						</Table.Cell>
						<Table.Cell class="hidden sm:table-cell">
							<span class="flex items-center">
								{#if product.productInStockQuantity < 1}
									<Indicator color="red" class="me-1.5" />Out of stock
								{:else}
									<Indicator color="green" class="me-1.5" />In stock
								{/if}
							</span>
						</Table.Cell>
						<Table.Cell class="hidden sm:table-cell">
							{#if isBaseSpirit(product.categoryName)}
								<div class="flex">
									<Badge variant="secondary" class="!p-1 !font-semibold !mx-auto">
										<Check class="h-3 w-3" />
										<span class="sr-only">Base Spirit</span>
									</Badge>
								</div>
							{/if}
						</Table.Cell>
					</Table.Row>

					<!-- opened -->
					<Table.Row class="!border-b-0">
						<Table.Cell colspan={6} class="!p-0 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-xl">
							<div
								class="grid transition-all duration-300 ease-out"
								style="grid-template-rows: {openRow === row ? '1fr' : '0fr'};"
							>
								<div class="overflow-hidden">
									<div class="px-4 py-4">
										<InventoryItem {product} isBaseSpirit={isBaseSpirit(product.categoryName)} />
									</div>
								</div>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</form>

{#if !search.length}
	<div class="flex flex-col items-center py-4">
		<Alert>
			<Info class="h-4 w-4" />
			<AlertDescription>No Results</AlertDescription>
		</Alert>
	</div>
{/if}

{#if search.length}
	<div class="flex flex-col items-center justify-center gap-2 p-7">
		<div class="text-sm text-gray-700 dark:text-gray-400">
			Page <span class="font-semibold text-gray-900 dark:text-white">
				{paginationData.from + 1}
			</span>
			of
			<span class="font-semibold text-gray-900 dark:text-white">
				{paginationData.to}
			</span>
			out of
			<span class="font-semibold text-gray-900 dark:text-white">
				{paginationData.total}
			</span>
			items in inventory
		</div>
		<nav class="flex items-center gap-1">
			<Button
				variant="outline"
				size="icon"
				onclick={() =>
					navigate('inventory', paginationData.prevPage || paginationData.currentPage)}
				disabled={!paginationData.prevPage}
			>
				<span class="sr-only">Previous</span>
				<ChevronLeft class="w-5 h-5" />
			</Button>
			{#each pages as p}
				<a
					class={cn(buttonVariants({ variant: p.active ? 'default' : 'outline', size: 'sm' }))}
					href={p.href}
				>
					{p.name}
				</a>
			{/each}
			<Button
				variant="outline"
				size="icon"
				onclick={() =>
					navigate('inventory', paginationData.nextPage || paginationData.currentPage)}
				disabled={!paginationData.nextPage}
			>
				<span class="sr-only">Next</span>
				<ChevronRight class="w-5 h-5" />
			</Button>
		</nav>
	</div>
{/if}
