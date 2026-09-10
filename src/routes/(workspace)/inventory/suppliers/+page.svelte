<script lang="ts">
	import { Plus, Search, Store, X } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import FilterButton from '$lib/components/FilterButton.svelte';
	import InventoryNav from '$lib/components/InventoryNav.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import StatBadge from '$lib/components/StatBadge.svelte';
	import SupplierCard from '$lib/components/SupplierCard.svelte';
	import SupplierFilterPanel from '$lib/components/SupplierFilterPanel.svelte';
	import SupplierTable from '$lib/components/SupplierTable.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import type { Supplier } from '$lib/types';
	import { roleCanModify, type WorkspaceWithRole } from '$lib/types/workspace';

	import type { PageData } from './$types';
	import { notificationStore } from '../../../../stores';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = roleCanModify(workspace?.workspaceRole);

	// local state
	let viewMode = $state<'table' | 'grid'>('table');
	let searchInput = $state('');
	let sortOption = $state('name-asc');
	let selectedType = $state('all');
	let filterOpen = $state(false);

	const count = (id: number) => data.productCounts[id] || 0;

	// 'liquor_store' -> 'Liquor store'
	const prettify = (typeName: string) =>
		(typeName.charAt(0).toUpperCase() + typeName.slice(1)).replace(/_/g, ' ');

	// full suppliertype lookup; filter matches on the type name
	const typeOptions = $derived(
		data.supplierTypes.map((t) => ({ value: String(t.name), label: prettify(String(t.name)) }))
	);

	const filteredSuppliers = $derived.by(() => {
		const q = searchInput.trim().toLowerCase();
		const list = data.suppliers.filter((s) => {
			if (selectedType !== 'all' && s.supplierTypeName !== selectedType) return false;
			if (!q) return true;
			return (
				(s.supplierName || '').toLowerCase().includes(q) ||
				(s.supplierTypeName || '').toLowerCase().includes(q) ||
				(s.supplierAddress || '').toLowerCase().includes(q)
			);
		});
		return [...list].sort((a, b) => {
			if (sortOption === 'products') return count(b.supplierId) - count(a.supplierId);
			const an = (a.supplierName || '').toLowerCase();
			const bn = (b.supplierName || '').toLowerCase();
			return sortOption === 'name-desc' ? bn.localeCompare(an) : an.localeCompare(bn);
		});
	});

	const activeFilterCount = $derived.by(() => {
		let c = 0;
		if (selectedType !== 'all') c++;
		if (sortOption !== 'name-asc') c++;
		return c;
	});

	function editSupplier(supplier: Supplier) {
		goto(`/inventory/suppliers/${supplier.supplierId}/edit`);
	}

	async function handleRemoveSupplier(supplierId: number) {
		try {
			const res = await fetch(`/api/suppliers?id=${supplierId}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to remove supplier');
			$notificationStore.success = { message: 'Supplier removed.' };
			await invalidateAll();
		} catch {
			$notificationStore.error = { message: 'Failed to remove supplier.' };
		}
	}

	async function handleRefresh() {
		await invalidateAll();
	}

	function resetFilters() {
		selectedType = 'all';
		sortOption = 'name-asc';
	}

	function clearAll() {
		searchInput = '';
		resetFilters();
	}

	// view mode persistence
	onMount(() => {
		const saved = localStorage.getItem('suppliers-view-mode');
		if (saved === 'grid' || saved === 'table') viewMode = saved;
	});

	function setViewMode(mode: 'table' | 'grid' | 'list') {
		if (mode === 'list') return;
		viewMode = mode;
		if (browser) localStorage.setItem('suppliers-view-mode', mode);
	}
</script>

<svelte:head>
	<title>Suppliers - Inventory</title>
</svelte:head>

<!-- Section nav + primary action above the hero -->
<InventoryNav>
	{#snippet action()}
		{#if canModify}
			<Button variant="primary" size="sm" href="/inventory/suppliers/add" class="shrink-0">
				<Plus class="h-4 w-4 mr-1" />
				Add Supplier
			</Button>
		{/if}
	{/snippet}
</InventoryNav>

<PageHero title="Suppliers" subtitle="Where your bottles and ingredients come from.">
	<div class="flex gap-2 flex-wrap pb-1 -mb-1">
		<StatBadge class="whitespace-nowrap">
			<Store class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{data.suppliers.length}</span>
			<span class="text-xs text-muted-foreground">Suppliers</span>
		</StatBadge>
	</div>
</PageHero>

<!-- Toolbar -->
<div class="flex items-center gap-2 mb-6">
	<div class="relative flex-1 min-w-0">
		<Search
			class="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-4 w-4 text-muted-foreground pointer-events-none"
		/>
		<Input
			type="text"
			placeholder="Search suppliers..."
			bind:value={searchInput}
			class="pl-10 pr-10"
		/>
		{#if searchInput}
			<button
				type="button"
				onclick={() => (searchInput = '')}
				class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
			>
				<X class="h-4 w-4" />
			</button>
		{/if}
	</div>

	<FilterButton
		bind:open={filterOpen}
		activeCount={activeFilterCount}
		viewModes={['table', 'grid']}
		activeView={viewMode}
		onViewChange={setViewMode}
		onRefresh={handleRefresh}
	>
		<SupplierFilterPanel
			types={typeOptions}
			{selectedType}
			{sortOption}
			onTypeChange={(v) => (selectedType = v || 'all')}
			onSortChange={(v) => (sortOption = v || 'name-asc')}
			onReset={resetFilters}
		/>
	</FilterButton>

	<ViewToggle modes={['table', 'grid']} active={viewMode} onchange={setViewMode} />
</div>

<!-- Results count -->
<div class="flex items-center justify-between mb-4">
	<p class="text-sm text-muted-foreground">
		Showing {filteredSuppliers.length} of {data.suppliers.length} suppliers
	</p>
</div>

<!-- Content -->
{#if data.suppliers.length === 0}
	<Card.Root class="border-dashed">
		<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
			<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
				<Store class="h-10 w-10 text-muted-foreground/50" />
			</div>
			<h3 class="text-xl font-semibold mb-2">No Suppliers Yet</h3>
			<p class="text-muted-foreground mb-6 max-w-md">
				Add your first supplier — find a store nearby or enter the details yourself.
			</p>
			{#if canModify}
				<Button variant="primary" onclick={() => goto('/inventory/suppliers/add')}>
					<Plus class="h-4 w-4 mr-2" />
					Add Supplier
				</Button>
			{/if}
		</Card.Content>
	</Card.Root>
{:else if filteredSuppliers.length === 0}
	<Card.Root class="border-dashed">
		<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
			<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
				<Search class="h-10 w-10 text-muted-foreground/50" />
			</div>
			<h3 class="text-xl font-semibold mb-2">No Matching Suppliers</h3>
			<p class="text-muted-foreground mb-6 max-w-md">Try adjusting your search or filters.</p>
			<Button variant="outline" onclick={clearAll}>Clear filters</Button>
		</Card.Content>
	</Card.Root>
{:else if viewMode === 'table'}
	<SupplierTable
		suppliers={filteredSuppliers}
		productCounts={data.productCounts}
		{canModify}
		onEdit={canModify ? editSupplier : undefined}
		onRemove={canModify ? handleRemoveSupplier : undefined}
	/>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each filteredSuppliers as supplier (supplier.supplierId)}
			<SupplierCard
				{supplier}
				{canModify}
				productCount={count(supplier.supplierId)}
				onRemove={canModify ? handleRemoveSupplier : undefined}
				onEdit={canModify ? editSupplier : undefined}
			/>
		{/each}
	</div>
{/if}
