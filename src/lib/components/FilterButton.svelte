<script lang="ts">
	import { ChevronDown, RefreshCw, SlidersHorizontal, X } from 'lucide-svelte';
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
		advanced,
		advancedLabel = 'Advanced Filters',
		advancedCount = 0,
		onDone,
		onClear,
	}: {
		open?: boolean;
		activeCount?: number;
		title?: string;
		viewModes?: ViewMode[];
		activeView?: ViewMode;
		onViewChange?: (mode: any) => void;
		onRefresh?: () => Promise<void> | void;
		children: Snippet;
		// optional advanced-filter fields; on mobile they expand inline in the sheet
		// (rather than jumping to a modal). desktop hosts still handle their own modal.
		advanced?: Snippet<[boolean]>;
		advancedLabel?: string;
		advancedCount?: number;
		// mobile sheet footer: Done commits (applies advanced) + closes; Clear resets everything
		onDone?: () => void;
		onClear?: () => void;
	} = $props();

	let isRefreshing = $state(false);

	// mobile-only: advanced section expanded inline within the sheet
	let advancedExpanded = $state(false);
	// collapse the advanced section whenever the sheet closes
	$effect(() => {
		if (!open) advancedExpanded = false;
	});

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

	function toggleAdvanced() {
		advancedExpanded = !advancedExpanded;
	}
</script>

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
		<Sheet.Content side="bottom" bind:open showClose={false}>
			<Sheet.Title>{title}</Sheet.Title>

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
			{#if advanced}
				<div class="mt-4 border-t border-border/50 pt-3">
					<button
						type="button"
						onclick={toggleAdvanced}
						aria-expanded={advancedExpanded}
						class="flex items-center justify-between w-full rounded-lg border border-input/50 px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors"
					>
						<span class="flex items-center gap-2">
							<SlidersHorizontal class="h-4 w-4 text-muted-foreground" />
							{advancedLabel}
							{#if advancedCount > 0}
								<span
									class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
								>
									{advancedCount}
								</span>
							{/if}
						</span>
						<ChevronDown
							class={cn(
								'h-4 w-4 text-muted-foreground transition-transform',
								advancedExpanded && 'rotate-180'
							)}
						/>
					</button>
					{#if advancedExpanded}
						<div class="mt-3">
							{@render advanced(advancedExpanded)}
						</div>
					{/if}
				</div>
			{/if}
			<div class="mt-6 flex flex-col gap-2">
				{#if onClear}
					<Button variant="outline" class="w-full" onclick={() => onClear?.()}>Clear</Button>
				{/if}
				<Button
					class="w-full"
					onclick={() => {
						onDone?.();
						open = false;
					}}
				>
					Done
				</Button>
			</div>
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
		<!-- prefer below+end, but let collision handling shift it back on-screen: the trigger
		     isn't always near the right edge (catalog has controls to its right), so a hard
		     align-end with no shift would run the panel off the left. side=bottom + the height
		     cap below keeps it from flipping up under the nav (there's always room below). -->
		<!-- scroll lives on an inner wrapper, not the glass element itself: a backdrop-filtered
		     scroll container renders square corners in webkit (ignores the panel radius). -->
		<Popover.Content
			align="end"
			side="bottom"
			collisionPadding={8}
			class="w-[36rem] max-w-[calc(100vw-1rem)] overflow-hidden"
		>
			<!-- refresh + close are low-value utilities → demoted to header icons.
			     close keeps the current filters; it only dismisses the panel -->
			<div class="flex items-center justify-between mb-3">
				<span class="text-base font-semibold">{title}</span>
				<div class="flex items-center gap-1">
					{#if onRefresh}
						<button
							type="button"
							onclick={handleRefresh}
							disabled={isRefreshing}
							aria-label="Refresh results"
							class="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
						>
							<RefreshCw class={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
						</button>
					{/if}
					<button
						type="button"
						onclick={() => (open = false)}
						aria-label="Close"
						class="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
					>
						<X class="h-4 w-4" />
					</button>
				</div>
			</div>
			<div
				class="max-h-[calc(var(--bits-popover-content-available-height)-4.5rem)] overflow-y-auto overscroll-contain"
			>
				{@render children()}
			</div>
		</Popover.Content>
	</Popover.Root>
{/if}
