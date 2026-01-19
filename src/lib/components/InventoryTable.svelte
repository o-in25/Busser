<script lang="ts">
	import type { PaginationData, Product, Spirit } from '$lib/types';
	import * as Table from '$lib/components/ui/table';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Indicator } from '$lib/components/ui/indicator';
	import {
		Check,
		ChevronLeft,
		ChevronRight,
		Info,
		FlaskConical,
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let products: Product[];
	export let paginationData: PaginationData;
	export let tableData: Spirit[];
	export let recipeUsage: Record<number, number> = {};
	export let onRowClick: ((product: Product) => void) | null = null;

	const handleRowClick = (product: Product) => {
		if (onRowClick) {
			onRowClick(product);
		}
	};

	const paginate = ({ total, perPage }: { total: number; perPage: number }) => {
		let range = Math.ceil(total / perPage);
		return [...Array(range)]
			.map((_, index) => index + 1)
			.map((page) => page.toString())
			.map((pageNum) => {
				// Preserve all existing URL params
				const params = new URLSearchParams($page.url.searchParams);
				params.set('page', pageNum);
				return {
					name: pageNum,
					href: `/inventory?${params.toString()}`,
					active: false,
				};
			});
	};

	$: search = products;
	$: activeUrl = $page.url.searchParams.get('page');
	$: pages = paginate(paginationData);

	$: urlParams_$ = $page.url.searchParams;

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
</script>

<!-- table -->
<div class="glass-table overflow-x-auto">
	<Table.Root>
		<Table.Header class="glass-table-header">
			<Table.Row>
				<Table.Head class="hidden sm:table-cell">Name</Table.Head>
				<Table.Head class="hidden sm:table-cell">Category</Table.Head>
				<Table.Head class="hidden sm:table-cell">Status</Table.Head>
				<Table.Head class="hidden sm:table-cell text-center">Used In</Table.Head>
				<Table.Head class="hidden sm:table-cell text-center">Base Spirit</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each search as product}
				<Table.Row
					onclick={() => handleRowClick(product)}
					class="cursor-pointer glass-table-row"
				>
					<Table.Cell>{product.productName}</Table.Cell>
					<Table.Cell class="hidden sm:table-cell">
						{product.categoryName}
					</Table.Cell>
					<Table.Cell class="hidden sm:table-cell">
						<span class="flex items-center">
							{#if product.productInStockQuantity === 0}
								<Indicator color="red" class="me-1.5" />Out of stock
							{:else if product.productInStockQuantity === 1}
								<Indicator color="yellow" class="me-1.5" />Low stock
							{:else}
								<Indicator color="green" class="me-1.5" />In stock
							{/if}
						</span>
					</Table.Cell>
					<Table.Cell class="hidden sm:table-cell">
						{#if product.productId && recipeUsage[product.productId]}
							<div class="flex justify-center">
								<Badge variant="secondary" class="gap-1">
									<FlaskConical class="h-3 w-3" />
									{recipeUsage[product.productId]}
								</Badge>
							</div>
						{:else}
							<div class="flex justify-center">
								<span class="text-muted-foreground text-sm">-</span>
							</div>
						{/if}
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
			{/each}
		</Table.Body>
	</Table.Root>
</div>

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
