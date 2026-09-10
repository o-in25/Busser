<script lang="ts">
	import { Package, ShoppingCart, Store, Tags } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	import SubNav from '$lib/components/SubNav.svelte';

	let { action }: { action?: Snippet } = $props();

	const tabs = [
		{
			href: '/inventory',
			label: 'Products',
			icon: Package,
			// products owns any /inventory route that isn't a sibling section
			match: (p: string) =>
				p === '/inventory' ||
				(p.startsWith('/inventory/') &&
					!p.startsWith('/inventory/category') &&
					!p.startsWith('/inventory/suppliers') &&
					!p.startsWith('/inventory/shopping-list')),
		},
		{
			href: '/inventory/category',
			label: 'Categories',
			icon: Tags,
			match: (p: string) => p.startsWith('/inventory/category'),
		},
		{
			href: '/inventory/suppliers',
			label: 'Suppliers',
			icon: Store,
			match: (p: string) => p.startsWith('/inventory/suppliers'),
		},
		{
			href: '/inventory/shopping-list',
			label: 'Shopping List',
			icon: ShoppingCart,
			match: (p: string) => p.startsWith('/inventory/shopping-list'),
		},
	];
</script>

<SubNav {tabs} {action} />
