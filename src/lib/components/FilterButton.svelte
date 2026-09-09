<script lang="ts">
	import { Dialog } from 'bits-ui';
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

		vh = window.innerHeight;
		const onResize = () => (vh = window.innerHeight);
		window.addEventListener('resize', onResize);

		return () => {
			mq.removeEventListener('change', handler);
			window.removeEventListener('resize', onResize);
		};
	});

	// draggable sheet: full height in the dom, translated down (y px). resting height fits the
	// content so everything shows, capped at LARGE; drag down past halfway (or fling) to dismiss.
	const LARGE = 0.92; // max height, fraction of viewport
	const FLICK = 0.55; // px/ms release = fling

	let vh = $state(0);
	let y = $state(0);
	let dragging = $state(false);
	let animating = $state(true);
	let handleEl = $state<HTMLElement>();
	let contentEl = $state<HTMLElement>();
	let contentH = $state(0);

	const largeH = $derived(vh * LARGE);
	const dismissY = $derived(largeH);
	const restingY = $derived(Math.max(0, largeH - contentH));

	const sheetStyle = $derived(
		`height:${largeH}px;transform:translateY(${y}px);` +
			`transition:${animating ? 'transform .34s cubic-bezier(.32,.72,0,1)' : 'none'};`
	);

	// pointer tracking for the drag gesture
	let startPointerY = 0;
	let startY = 0;
	let lastPointerY = 0;
	let lastT = 0;
	let velocity = 0;

	function measure() {
		if (handleEl && contentEl) contentH = handleEl.offsetHeight + contentEl.offsetHeight;
	}

	function snapTo(target: number) {
		animating = true;
		y = target;
	}

	function dismiss() {
		animating = true;
		y = dismissY;
		// let the slide-down play before we actually unmount
		window.setTimeout(() => (open = false), 300);
	}

	// start off-screen; the measure effect slides it up once content is laid out
	function onOpenChange(next: boolean) {
		if (!next) return;
		animating = false;
		y = dismissY;
	}

	// re-measure and settle to the resting height on open, advanced toggle, or resize
	$effect(() => {
		if (!open || !isMobile || !handleEl || !contentEl) return;
		advancedExpanded;
		vh;
		requestAnimationFrame(() => {
			measure();
			if (!dragging) requestAnimationFrame(() => snapTo(restingY));
		});
	});

	function onGrabStart(e: PointerEvent) {
		dragging = true;
		animating = false;
		startPointerY = e.clientY;
		startY = y;
		lastPointerY = e.clientY;
		lastT = e.timeStamp;
		velocity = 0;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onGrabMove(e: PointerEvent) {
		if (!dragging) return;
		let next = startY + (e.clientY - startPointerY);
		if (next < restingY) next = restingY; // can't expand past the content
		if (next > dismissY) next = dismissY;
		y = next;
		const dt = e.timeStamp - lastT;
		if (dt > 0) {
			velocity = (e.clientY - lastPointerY) / dt;
			lastPointerY = e.clientY;
			lastT = e.timeStamp;
		}
	}

	function onGrabEnd(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			// capture may already be released
		}
		settle();
	}

	function settle() {
		const range = dismissY - restingY;
		if (velocity > FLICK) dismiss();
		else if (velocity < -FLICK) snapTo(restingY);
		else if (range > 0 && y - restingY > range * 0.4) dismiss();
		else snapTo(restingY);
	}

	// the measure effect re-sizes the sheet to fit once advanced expands
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
	<Sheet.Root bind:open {onOpenChange}>
		<Sheet.Trigger
			class={cn(
				buttonVariants({ variant: 'outline' }),
				'relative shrink-0 h-10 w-10 px-0 sm:w-auto sm:px-4'
			)}
		>
			{@render trigger()}
		</Sheet.Trigger>
		<Dialog.Portal>
			<Sheet.Overlay />
			<Dialog.Content
				onInteractOutside={(e) => {
					e.preventDefault();
					dismiss();
				}}
				onEscapeKeydown={(e) => {
					e.preventDefault();
					dismiss();
				}}
				class="glass-sheet fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t focus:outline-none"
				style={sheetStyle}
			>
				<!-- drag handle: grabber + title. everything else scrolls -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					bind:this={handleEl}
					onpointerdown={onGrabStart}
					onpointermove={onGrabMove}
					onpointerup={onGrabEnd}
					onpointercancel={onGrabEnd}
					class="shrink-0 cursor-grab touch-none select-none px-6 pt-2.5 active:cursor-grabbing"
				>
					<div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30"></div>
					<Sheet.Title>{title}</Sheet.Title>
				</div>

				<div class="flex-1 overflow-y-auto overscroll-contain">
					<div
						bind:this={contentEl}
						class="px-6"
						style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));"
					>
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
									dismiss();
								}}
							>
								Done
							</Button>
						</div>
					</div>
				</div>
			</Dialog.Content>
		</Dialog.Portal>
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
