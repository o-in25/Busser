<script lang="ts">
	import { RefreshCw, SlidersHorizontal, X } from 'lucide-svelte';
	import { onMount, type Snippet } from 'svelte';

	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import * as Sheet from '$lib/components/ui/sheet';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
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
		<div class="mt-3">
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
			class={cn(
				buttonVariants({ variant: 'outline' }),
				'relative shrink-0 h-10 w-10 px-0 sm:w-auto sm:px-4'
			)}
		>
			{@render trigger()}
		</Sheet.Trigger>
		<Sheet.Content side="bottom" class="rounded-t-2xl overflow-y-auto">
			<Sheet.Header>
				<Sheet.Title>{title}</Sheet.Title>
			</Sheet.Header>
			{#if (viewModes && activeView && onViewChange) || onRefresh}
				<div class="flex items-end gap-2 mt-4">
					{#if viewModes && activeView && onViewChange}
						<div class="flex flex-col gap-1.5">
							<span class="text-sm font-medium text-muted-foreground">View</span>
							<ViewToggle
								modes={viewModes}
								active={activeView}
								onchange={onViewChange}
								class="flex w-fit"
							/>
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
							<RefreshCw
								class={cn('h-4 w-4 text-muted-foreground', isRefreshing && 'animate-spin')}
							/>
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
			class={cn(
				buttonVariants({ variant: 'outline' }),
				'relative shrink-0 h-10 w-10 px-0 sm:w-auto sm:px-4'
			)}
		>
			{@render trigger()}
		</Popover.Trigger>
		<!-- force downward so it never flips up under the nav; align end keeps it on-screen
		     (avoidCollisions off also disables horizontal shift, so anchor to the right edge).
		     cap height to the space below the trigger and scroll — handles short viewports. -->
		<!-- scroll lives on an inner wrapper, not the glass element itself: a backdrop-filtered
		     scroll container renders square corners in webkit (ignores the panel radius). -->
		<Popover.Content
			align="end"
			side="bottom"
			avoidCollisions={false}
			collisionPadding={8}
			class="w-[36rem] max-w-[calc(100vw-1rem)] overflow-hidden"
		>
			<!-- close keeps the current filters; it only dismisses the panel -->
			<div class="flex items-center justify-between mb-3">
				<span class="text-base font-semibold">{title}</span>
				<button
					type="button"
					onclick={() => (open = false)}
					aria-label="Close"
					class="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
			<div
				class="max-h-[calc(var(--bits-popover-content-available-height)-4.5rem)] overflow-y-auto overscroll-contain"
			>
				{@render children()}
				{@render refreshButton()}
			</div>
		</Popover.Content>
	</Popover.Root>
{/if}
