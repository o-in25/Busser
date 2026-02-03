<script lang="ts">
	import { Package, Tags } from 'lucide-svelte';

	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	const tabs = [
		{ href: '/inventory', label: 'Products', icon: Package },
		{ href: '/inventory/category', label: 'Categories', icon: Tags },
	];

	// Check if a tab is active (exact match for /inventory, starts with for /inventory/category)
	function isActive(href: string): boolean {
		const path = $page.url.pathname;
		if (href === '/inventory') {
			// Products tab: active only for /inventory or /inventory/add or /inventory/[id]/edit
			return path === '/inventory' || (path.startsWith('/inventory/') && !path.startsWith('/inventory/category'));
		}
		// Categories tab: active for anything starting with /inventory/category
		return path.startsWith(href);
	}
</script>

<nav class="mb-6">
	<div class="flex md:inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
		{#each tabs as tab}
			<a
				href={tab.href}
				class={cn(
					'flex-1 md:flex-none inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					isActive(tab.href)
						? 'bg-primary text-primary-foreground shadow-sm'
						: 'hover:bg-background/50 hover:text-foreground'
				)}
			>
				<tab.icon class="h-4 w-4 mr-2" />
				{tab.label}
			</a>
		{/each}
	</div>
</nav>
