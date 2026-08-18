<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Package, Store, Tags } from 'lucide-svelte';

	import { page } from '$app/stores';
	import WorkspaceSwitcherBadge from '$lib/components/WorkspaceSwitcherBadge.svelte';
	import { cn } from '$lib/utils';

	let { action }: { action?: Snippet } = $props();

	const isOwner = $derived($page.data.workspace?.workspaceRole === 'owner');

	const allTabs = [
		{ href: '/inventory', label: 'Products', icon: Package },
		{ href: '/inventory/category', label: 'Categories', icon: Tags },
		{ href: '/inventory/suppliers', label: 'Suppliers', icon: Store, ownerOnly: true },
	];

	const tabs = $derived(allTabs.filter((t) => !t.ownerOnly || isOwner));

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

<nav class="mb-6 flex items-center gap-2">
	<div
		class="relative inline-flex h-10 min-w-0 items-center justify-start gap-1 rounded-xl backdrop-blur-xl bg-white/10 dark:bg-zinc-800/30 shadow-lg shadow-black/5 dark:shadow-black/15 p-0.5 text-muted-foreground"
	>
		{#each tabs as tab}
			<a
				href={tab.href}
				class={cn(
					'md:flex-none inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-1.5 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					isActive(tab.href)
						? 'bg-primary/25 dark:bg-primary/20 text-primary dark:text-[rgba(248,78,128,1)] backdrop-blur-sm ring-1 ring-primary/30 shadow-[0_0_12px_rgba(248,78,128,0.25)]'
						: 'hover:bg-white/10 dark:hover:bg-zinc-700/25 hover:text-foreground'
				)}
				aria-label={tab.label}
			>
				<tab.icon class="h-4 w-4" />
				<!-- label only shows on the active tab on mobile; always on desktop -->
				<span class={cn('md:ml-2 md:inline', isActive(tab.href) ? 'ml-2 inline' : 'hidden')}>
					{tab.label}
				</span>
			</a>
		{/each}
	</div>
	<div class="ml-auto flex items-center gap-2 shrink-0">
		<!-- desktop-only; flex wrapper (not block) so the button has no baseline strut and matches sibling button height -->
		<span class="hidden md:flex items-center">
			<WorkspaceSwitcherBadge workspaceName={$page.data.workspace?.workspaceName} />
		</span>
		{#if action}
			{@render action()}
		{/if}
	</div>
</nav>
