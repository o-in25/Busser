<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { getContext, onMount, tick } from 'svelte';

	import { Label } from '$lib/components/ui/label';
	import {
		NESTED_CREATE_KEY,
		type NestedCreateKind,
		type NestedCreateStack,
	} from '$lib/stores/nestedCreate.svelte';
	import type { SelectOption } from '$lib/types';
	import { cn } from '$lib/utils';

	// svelte 5 replacement for Autocomplete: keyboard nav + nested-create "+" instead of page nav
	let {
		label,
		value = $bindable(null),
		fetchUrl,
		placeholder = '',
		name = '',
		key = undefined,
		required = false,
		grant = '',
		createKind = undefined,
		onselect,
	}: {
		label: string;
		value?: string | null;
		fetchUrl: string;
		placeholder?: string;
		name?: string;
		key?: string;
		required?: boolean;
		grant?: string;
		createKind?: NestedCreateKind;
		onselect?: (item: SelectOption) => void;
	} = $props();

	const permissions = getContext<string[]>('permissions') ?? [];
	const stack = getContext<NestedCreateStack | undefined>(NESTED_CREATE_KEY);

	let items = $state<SelectOption[]>([]);
	let show = $state(false);
	let display = $state(key ?? '');
	let activeIndex = $state(-1);
	let inputEl = $state<HTMLInputElement>();

	onMount(async () => {
		try {
			const res = await fetch(fetchUrl);
			items = await res.json();
			syncDisplayFromValue();
		} catch {
			// leave items empty on failure
		}
	});

	// re-seed display when the key prop changes externally (draft restore)
	let prevKey = key;
	$effect(() => {
		if (key !== prevKey) {
			prevKey = key;
			display = key ?? '';
		}
	});

	function syncDisplayFromValue() {
		if (value && items.length && !display) {
			const m = items.find((i) => String(i.value) === String(value));
			if (m) display = m.name;
		}
	}

	const filtered = $derived(
		items.filter((i) => i.name.toLowerCase().includes(display.toLowerCase().trim()))
	);

	// resolve value from an exact display match (null while partially typed)
	$effect(() => {
		const exact = items.find((i) => i.name.toLowerCase().trim() === display.toLowerCase().trim());
		value = exact ? String(exact.value) : null;
	});

	const showCreate = $derived(
		!!createKind && !!stack && (!grant || permissions.includes(grant))
	);

	function open() {
		show = true;
		activeIndex = -1;
	}
	function close() {
		// delay so option mousedown registers before blur hides the list
		setTimeout(() => {
			show = false;
			activeIndex = -1;
		}, 120);
	}

	function pick(item: SelectOption) {
		if (!items.some((i) => String(i.value) === String(item.value))) {
			items = [...items, item];
		}
		display = item.name;
		value = String(item.value);
		show = false;
		onselect?.(item);
	}

	function onKey(e: KeyboardEvent) {
		if (!show && e.key === 'ArrowDown') {
			open();
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (e.key === 'Enter') {
			if (show && activeIndex >= 0 && filtered[activeIndex]) {
				e.preventDefault();
				pick(filtered[activeIndex]);
			}
		} else if (e.key === 'Escape') {
			show = false;
		}
	}

	async function handleCreate() {
		if (!stack || !createKind) return;
		const created = await stack.open({ kind: createKind, prefillName: display.trim() });
		if (created) {
			pick(created);
			await tick();
			inputEl?.focus();
		}
	}

	const inputClasses =
		'glass-surface flex h-10 w-full px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground/80 focus-visible:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:shadow-glow-cyan';
</script>

<div class="w-full">
	<input type="hidden" {name} {value} />
	<Label class="mb-2 block">
		{label}{#if required}
			<span class="text-destructive">*</span>{/if}
	</Label>
	<div class="flex gap-2">
		<div class="relative flex-1">
			<input
				bind:this={inputEl}
				type="text"
				{placeholder}
				{required}
				value={display}
				oninput={(e) => {
					display = e.currentTarget.value;
					show = true;
					activeIndex = -1;
				}}
				onfocus={open}
				onblur={close}
				onkeydown={onKey}
				class={inputClasses}
			/>
			{#if show && filtered.length}
				<div class="glass-dropdown absolute z-50 mt-1 max-h-52 w-full overflow-y-auto p-1">
					{#each filtered as item, i (item.value)}
						<button
							type="button"
							class={cn(
								'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
								i === activeIndex ? 'bg-primary/15 text-primary' : 'hover:bg-accent/60'
							)}
							onmousedown={() => pick(item)}
							onmouseenter={() => (activeIndex = i)}
						>
							{item.name}
						</button>
					{/each}
				</div>
			{:else if show && display.trim() && !filtered.length}
				<div class="glass-dropdown absolute z-50 mt-1 w-full p-3 text-sm text-muted-foreground">
					No matches{#if showCreate} — tap + to create “{display.trim()}”{/if}
				</div>
			{/if}
		</div>
		{#if showCreate}
			<button
				type="button"
				aria-label="Create new {createKind}"
				onclick={handleCreate}
				class="glass-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary transition-colors hover:bg-white/40 dark:hover:bg-zinc-700/50"
			>
				<Plus class="h-4 w-4" />
			</button>
		{/if}
	</div>
</div>
