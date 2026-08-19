<script lang="ts">
	import { Package, Store, Tags } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	import { page } from '$app/stores';
	import SubNav from '$lib/components/SubNav.svelte';

	let { action }: { action?: Snippet } = $props();

	const isOwner = $derived($page.data.workspace?.workspaceRole === 'owner');

	const tabs = $derived([
		{
			href: '/inventory',
			label: 'Products',
			icon: Package,
			// products owns any /inventory route that isn't a sibling section
			match: (p: string) =>
				p === '/inventory' ||
				(p.startsWith('/inventory/') &&
					!p.startsWith('/inventory/category') &&
					!p.startsWith('/inventory/suppliers')),
		},
		{
			href: '/inventory/category',
			label: 'Categories',
			icon: Tags,
			match: (p: string) => p.startsWith('/inventory/category'),
		},
		...(isOwner
			? [
					{
						href: '/inventory/suppliers',
						label: 'Suppliers',
						icon: Store,
						match: (p: string) => p.startsWith('/inventory/suppliers'),
					},
				]
			: []),
	]);
</script>

<SubNav {tabs} {action} />
