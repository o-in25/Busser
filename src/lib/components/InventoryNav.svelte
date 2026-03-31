<script lang="ts">
	import { Package, Store, Tags } from 'lucide-svelte';

	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	const tabs = [
		{ href: '/inventory', label: 'Products', icon: Package },
		{ href: '/inventory/category', label: 'Categories', icon: Tags },
		{ href: '/inventory/suppliers', label: 'Suppliers', icon: Store },
	];

	function isActive(href: string): boolean {
		const path = $page.url.pathname;
		if (href === '/inventory') {
			return (
				path === '/inventory' ||
				(path.startsWith('/inventory/') &&
					!path.startsWith('/inventory/category') &&
					!path.startsWith('/inventory/suppliers'))
			);
		}
		return path.startsWith(href);
	}
</script>

<nav class="mb-6">
	<div
		class="relative flex md:inline-flex h-10 items-center justify-center rounded-xl backdrop-blur-xl bg-white/10 dark:bg-zinc-800/30 shadow-lg shadow-black/5 dark:shadow-black/15 p-0.5 text-muted-foreground"
	>
		{#each tabs as tab}
			<a
				href={tab.href}
				class={cn(
					'flex-1 md:flex-none inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-1.5 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					isActive(tab.href)
						? 'bg-primary/25 dark:bg-primary/20 text-primary dark:text-[rgba(248,78,128,1)] backdrop-blur-sm ring-1 ring-primary/30 shadow-[0_0_12px_rgba(248,78,128,0.25)]'
						: 'hover:bg-white/10 dark:hover:bg-zinc-700/25 hover:text-foreground'
				)}
			>
				<tab.icon class="h-4 w-4 mr-2" />
				{tab.label}
			</a>
		{/each}
	</div>
</nav>
