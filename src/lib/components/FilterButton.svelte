<script lang="ts">
	import { LayoutGrid, List, RefreshCw, SlidersHorizontal, TableIcon } from 'lucide-svelte';
	import { onMount, type Snippet } from 'svelte';

	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import * as Sheet from '$lib/components/ui/sheet';
	import { cn } from '$lib/utils';

	type ViewMode = 'table' | 'grid' | 'list';

	let {
		open = $bindable(false),
		activeCount = 0,
		title = 'Filters',
		viewModes,
		activeView,
		onViewChange,
		onRefresh,
		children,
	}: {
		open?: boolean;
		activeCount?: number;
		title?: string;
		viewModes?: ViewMode[];
		activeView?: ViewMode;
		onViewChange?: (mode: any) => void;
		onRefresh?: () => Promise<void> | void;
		children: Snippet;
	} = $props();

	let isRefreshing = $state(false);

	async function handleRefresh() {
		if (!onRefresh) return;
		isRefreshing = true;
		try {
			await onRefresh();
		} finally {
			isRefreshing = false;
		}
	}

	const viewIcons: Record<ViewMode, typeof TableIcon> = {
		table: TableIcon,
		grid: LayoutGrid,
		list: List,
	};

	const viewLabels: Record<ViewMode, string> = {
		table: 'Table',
		grid: 'Grid',
		list: 'List',
	};

	let isMobile = $state(false);

	onMount(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		isMobile = mq.matches;
		const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});
</script>

{#snippet refreshButton()}
	{#if onRefresh}
		<div class="border-t border-border/50 pt-3 mt-4">
			<button
				onclick={handleRefresh}
				disabled={isRefreshing}
				class="flex items-center gap-2 w-full rounded-lg border border-input/50 px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors disabled:opacity-50"
			>
				<RefreshCw class={cn('h-4 w-4 text-muted-foreground', isRefreshing && 'animate-spin')} />
				{isRefreshing ? 'Refreshing...' : 'Refresh results'}
			</button>
		</div>
	{/if}
{/snippet}

{#snippet trigger()}
	<SlidersHorizontal class="h-4 w-4 sm:mr-2" />
	<span class="hidden sm:inline">Filters</span>
	{#if activeCount > 0}
		<span
			class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
		>
			{activeCount}
		</span>
	{/if}
{/snippet}

{#if isMobile}
	<Sheet.Root bind:open>
		<Sheet.Trigger
			class={cn(buttonVariants({ variant: 'outline' }), 'relative shrink-0 h-10 w-10 px-0 sm:w-auto sm:px-4')}
		>
			{@render trigger()}
		</Sheet.Trigger>
		<Sheet.Content side="bottom" class="rounded-t-2xl max-h-[70vh] overflow-y-auto">
			<Sheet.Header>
				<Sheet.Title>{title}</Sheet.Title>
			</Sheet.Header>
			{#if (viewModes && activeView && onViewChange) || onRefresh}
				<div class="flex items-end gap-2 mt-4">
					{#if viewModes && activeView && onViewChange}
						<div class="flex flex-col gap-1.5">
							<span class="text-sm font-medium text-muted-foreground">View</span>
							<div class="flex items-center border border-input/50 rounded-lg overflow-hidden w-fit">
								{#each viewModes as mode}
									{@const Icon = viewIcons[mode]}
									<button
										class={cn(
											'h-10 px-3 flex items-center justify-center gap-1.5 text-sm transition-colors',
											activeView === mode ? 'bg-accent text-primary-foreground' : 'hover:bg-muted'
										)}
										onclick={() => onViewChange(mode)}
									>
										<Icon class="h-4 w-4" />
										{viewLabels[mode]}
									</button>
								{/each}
							</div>
						</div>
					{/if}
					{#if onRefresh}
						<button
							onclick={handleRefresh}
							disabled={isRefreshing}
							class={cn(
								'h-10 w-10 flex items-center justify-center rounded-lg border border-input/50 hover:bg-accent/50 transition-colors disabled:opacity-50 ml-auto shrink-0'
							)}
							aria-label="Refresh results"
						>
							<RefreshCw class={cn('h-4 w-4 text-muted-foreground', isRefreshing && 'animate-spin')} />
						</button>
					{/if}
				</div>
			{/if}
			<div class="mt-4">
				{@render children()}
			</div>
			<Sheet.Footer class="mt-6">
				<Button class="w-full" onclick={() => (open = false)}>Done</Button>
			</Sheet.Footer>
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<Popover.Root bind:open>
		<Popover.Trigger
			class={cn(buttonVariants({ variant: 'outline' }), 'relative shrink-0 h-10 w-10 px-0 sm:w-auto sm:px-4')}
		>
			{@render trigger()}
		</Popover.Trigger>
		<Popover.Content align="start" class="w-80">
			{@render children()}
			{@render refreshButton()}
		</Popover.Content>
	</Popover.Root>
{/if}
