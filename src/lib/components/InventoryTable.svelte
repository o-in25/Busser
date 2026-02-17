<script lang="ts">
	import { FlaskConical, Info } from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Pagination from '$lib/components/Pagination.svelte';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Indicator } from '$lib/components/ui/indicator';
	import * as Table from '$lib/components/ui/table';
	import type { PaginationData, Product } from '$lib/types';
	import { cn } from '$lib/utils';

	export let products: Product[];
	export let paginationData: PaginationData;
	export let recipeUsage: Record<number, number> = {};
	export let onRowClick: ((product: Product) => void) | null = null;
	export let selectable: boolean = false;
	export let selectedIds: number[] = [];
	export let onSelectionChange: ((ids: number[]) => void) | null = null;

	const handleRowClick = (product: Product) => {
		if (onRowClick) {
			onRowClick(product);
		}
	};

	const toggleSelection = (productId: number | null) => {
		if (!productId) return;
		const idx = selectedIds.indexOf(productId);
		const next =
			idx >= 0 ? selectedIds.filter((id) => id !== productId) : [...selectedIds, productId];
		selectedIds = next;
		onSelectionChange?.(next);
	};

	const toggleAll = (checked: boolean) => {
		const next = checked
			? products.map((p) => p.productId).filter((id): id is number => id !== null)
			: [];
		selectedIds = next;
		onSelectionChange?.(next);
	};

	$: allSelected =
		products.length > 0 && products.every((p) => p.productId && selectedIds.includes(p.productId));

	$: search = products;

	$: urlParams_$ = $page.url.searchParams;

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

</script>

<!-- mobile select-all -->
{#if selectable}
	<div class="flex sm:hidden items-center gap-2 px-3 py-2 mb-1">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div onclick={(e) => e.stopPropagation()}>
			<Checkbox checked={allSelected} onchange={toggleAll} />
		</div>
		<span class="text-sm text-muted-foreground">Select all</span>
	</div>
{/if}

<!-- table -->
<div class="glass-table overflow-x-auto">
	<Table.Root>
		<Table.Header class="glass-table-header hidden sm:table-header-group">
			<Table.Row>
				{#if selectable}
					<Table.Head class="w-10">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="flex items-center justify-center" onclick={(e) => e.stopPropagation()}>
							<Checkbox checked={allSelected} onchange={toggleAll} />
						</div>
					</Table.Head>
				{/if}
				<Table.Head class="hidden sm:table-cell">Name</Table.Head>
				<Table.Head class="hidden sm:table-cell">Category</Table.Head>
				<Table.Head class="hidden sm:table-cell">Status</Table.Head>
				<Table.Head class="hidden sm:table-cell text-center">Used In</Table.Head>
				<Table.Head class="hidden sm:table-cell">Group</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each search as product}
				<Table.Row onclick={() => handleRowClick(product)} class="cursor-pointer glass-table-row">
					{#if selectable}
						<Table.Cell class="w-10">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="flex items-center justify-center" onclick={(e) => e.stopPropagation()}>
								<Checkbox
									checked={!!product.productId && selectedIds.includes(product.productId)}
									onchange={() => toggleSelection(product.productId)}
								/>
							</div>
						</Table.Cell>
					{/if}
					<Table.Cell>{product.productName}</Table.Cell>
					<Table.Cell class="hidden sm:table-cell">
						{product.categoryName}
					</Table.Cell>
					<Table.Cell class="hidden sm:table-cell">
						<span class="flex items-center">
							{#if product.productInStockQuantity === 0}
								<Indicator color="red" class="me-1.5" />Out of stock
							{:else}
								<Indicator color="green" class="me-1.5" />In stock
							{/if}
						</span>
					</Table.Cell>
					<Table.Cell class="hidden sm:table-cell">
						{#if product.productId && recipeUsage[product.productId]}
							<div class="flex justify-center">
								<a href="/catalog/browse?ingredient={product.productId}">
									<Badge
										variant="secondary"
										class="gap-1 hover:bg-secondary/80 transition-colors cursor-pointer"
									>
										<FlaskConical class="h-3 w-3" />
										{recipeUsage[product.productId]}
									</Badge>
								</a>
							</div>
						{:else}
							<div class="flex justify-center">
								<span class="text-muted-foreground text-sm">-</span>
							</div>
						{/if}
					</Table.Cell>
					<Table.Cell class="hidden sm:table-cell">
						{#if product.categoryGroupName}
							<Badge variant="outline">{product.categoryGroupName}</Badge>
						{:else}
							<span class="text-muted-foreground text-sm">-</span>
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
	<Pagination
		pagination={paginationData}
		itemLabel="products"
		onNavigate={(p) => navigate('inventory', p)}
	/>
{/if}
