<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import { untrack } from 'svelte';

	import { cn } from '$lib/utils';

	import SheetOverlay from './sheet-overlay.svelte';

	let {
		open = $bindable(false),
		class: className,
		children,
		...restProps
	}: SheetPrimitive.ContentProps & { open?: boolean } = $props();

	// native iOS bottom sheet: full-height el translated down (y), resting at content height.
	// force-mounted so the slide-down plays on any close, not just drag-to-dismiss.
	const LARGE = 0.92; // max height, fraction of viewport
	const FLICK = 0.55; // px/ms release velocity = fling

	let vh = $state(0);
	// park off-screen for SSR / first paint (real dismissY lands once vh is known)
	let y = $state(9999);
	let animating = $state(false);
	let dragging = $state(false);
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

	function openSheet() {
		vh = window.innerHeight;
		requestAnimationFrame(() => {
			measure();
			requestAnimationFrame(() => snapTo(restingY));
		});
	}

	// runs first so vh is known before the open-driver computes dismissY
	$effect(() => {
		vh = window.innerHeight;
		const onResize = () => (vh = window.innerHeight);
		window.addEventListener('resize', onResize);

		// re-fit whenever content height changes (async loads, expanding sections)
		const ro = new ResizeObserver(() => {
			measure();
			if (open && !dragging) requestAnimationFrame(() => snapTo(restingY));
		});
		if (contentEl) ro.observe(contentEl);
		if (handleEl) ro.observe(handleEl);

		return () => {
			window.removeEventListener('resize', onResize);
			ro.disconnect();
		};
	});

	// drive the slide from whatever `open` does — drag-to-dismiss, Done/Close buttons, esc, etc.
	$effect(() => {
		const isOpen = open;
		untrack(() => (isOpen ? openSheet() : snapTo(dismissY)));
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
		if (velocity > FLICK) open = false;
		else if (velocity < -FLICK) snapTo(restingY);
		else if (range > 0 && y - restingY > range * 0.4) open = false;
		else snapTo(restingY);
	}
</script>

<SheetPrimitive.Portal>
	<SheetOverlay />
	<SheetPrimitive.Content
		forceMount
		preventScroll={false}
		onOpenAutoFocus={(e) => e.preventDefault()}
		onInteractOutside={(e) => {
			e.preventDefault();
			open = false;
		}}
		onEscapeKeydown={(e) => {
			e.preventDefault();
			open = false;
		}}
		class="glass-sheet fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t focus:outline-none"
		style={sheetStyle}
		{...restProps}
	>
		<!-- grabber: the drag zone. everything below it scrolls -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={handleEl}
			onpointerdown={onGrabStart}
			onpointermove={onGrabMove}
			onpointerup={onGrabEnd}
			onpointercancel={onGrabEnd}
			class="shrink-0 cursor-grab touch-none select-none px-6 pt-2.5 pb-1 active:cursor-grabbing"
		>
			<div class="mx-auto h-1.5 w-10 rounded-full bg-muted-foreground/30"></div>
		</div>

		<div class="flex-1 overflow-y-auto overscroll-contain">
			<div
				bind:this={contentEl}
				class={cn('px-6 pt-3', className)}
				style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));"
			>
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</SheetPrimitive.Content>
</SheetPrimitive.Portal>
