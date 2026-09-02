<script lang="ts">
	import type { Snippet } from 'svelte';

	import { page } from '$app/stores';
	import WorkspaceSwitcherBadge from '$lib/components/WorkspaceSwitcherBadge.svelte';
	import { cn } from '$lib/utils';

	type Tab = {
		href: string;
		label: string;
		icon: typeof import('lucide-svelte').Package;
		// custom active check for nested routes; defaults to exact path match
		match?: (path: string) => boolean;
	};

	let {
		tabs,
		action,
		workspaceSwitcher = true,
		class: className,
	}: { tabs: Tab[]; action?: Snippet; workspaceSwitcher?: boolean; class?: string } = $props();

	function isActive(tab: Tab): boolean {
		const path = $page.url.pathname;
		return tab.match ? tab.match(path) : path === tab.href;
	}
</script>

<!-- mobile stacks (tabs row, then switcher + action row); desktop is a single row -->
<nav class={cn('mb-6 flex flex-col md:flex-row md:items-center gap-2', className)}>
	<div
		class="relative flex w-full md:w-auto h-10 min-w-0 items-center justify-start gap-1 overflow-x-auto scrollbar-none rounded-xl backdrop-blur-xl bg-white/10 dark:bg-zinc-800/30 shadow-lg shadow-black/5 dark:shadow-black/15 p-0.5 text-muted-foreground"
	>
		{#each tabs as tab}
			<a
				href={tab.href}
				class={cn(
					'flex-1 md:flex-none inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-1.5 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					isActive(tab)
						? 'bg-primary/25 dark:bg-primary/20 text-primary dark:text-[rgba(248,78,128,1)] backdrop-blur-sm ring-1 ring-primary/30 shadow-[0_0_12px_rgba(248,78,128,0.25)]'
						: 'hover:bg-white/10 dark:hover:bg-zinc-700/25 hover:text-foreground'
				)}
				aria-label={tab.label}
			>
				<tab.icon class="h-4 w-4 shrink-0" />
				<span class="ml-2">{tab.label}</span>
			</a>
		{/each}
	</div>
	{#if workspaceSwitcher || action}
		<div class="flex items-center gap-2 md:ml-auto">
			{#if workspaceSwitcher}
				<WorkspaceSwitcherBadge workspaceName={$page.data.workspace?.workspaceName} />
			{/if}
			{#if action}
				<div class="ml-auto md:ml-0 shrink-0">{@render action()}</div>
			{/if}
		</div>
	{/if}
</nav>
