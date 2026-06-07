<script lang="ts">
	import { Minus, Plus } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	// glass digit-style number field with unit suffix + optional preset chips.
	// keeps a local text buffer so decimals like "0." can be typed without the value clobbering them.
	let {
		value = $bindable(0),
		unit,
		min,
		max,
		step = 1,
		presets,
		placeholder = '0',
		name,
		class: className,
		onchange,
	}: {
		value?: number;
		unit?: string;
		min?: number;
		max?: number;
		step?: number;
		presets?: { label: string; value: number }[];
		placeholder?: string;
		name?: string;
		class?: string;
		onchange?: (v: number) => void;
	} = $props();

	let text = $state(value != null ? String(value) : '');
	let lastEmitted = value;

	// reflect external value changes (draft restore, unit conversion) without overwriting typing
	$effect(() => {
		if (value !== lastEmitted) {
			lastEmitted = value;
			if (parseFloat(text) !== value) text = value != null ? String(value) : '';
		}
	});

	function clamp(v: number) {
		if (typeof min === 'number' && v < min) v = min;
		if (typeof max === 'number' && v > max) v = max;
		return v;
	}

	function emit(v: number) {
		const c = clamp(v);
		lastEmitted = c;
		value = c;
		onchange?.(c);
	}

	function onInput(e: Event) {
		const raw = (e.currentTarget as HTMLInputElement).value;
		text = raw;
		const parsed = parseFloat(raw);
		emit(Number.isFinite(parsed) ? parsed : 0);
	}

	function set(v: number) {
		const c = clamp(v);
		text = String(c);
		emit(c);
	}

	function bump(dir: number) {
		set((value || 0) + dir * step);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			bump(1);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			bump(-1);
		}
	}
</script>

<div class={cn('space-y-2', className)}>
	<div
		class="glass-surface flex items-stretch overflow-hidden rounded-xl transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/30 dark:focus-within:shadow-glow-cyan"
	>
		<button
			type="button"
			tabindex="-1"
			aria-label="decrease"
			onclick={() => bump(-1)}
			class="flex items-center px-3 text-muted-foreground transition-colors hover:bg-white/30 hover:text-foreground dark:hover:bg-zinc-700/40"
		>
			<Minus class="h-4 w-4" />
		</button>
		<input
			type="text"
			inputmode="decimal"
			{placeholder}
			value={text}
			oninput={onInput}
			onkeydown={onKey}
			class="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-center text-2xl font-semibold tabular-nums tracking-wide outline-none"
		/>
		{#if unit}
			<span
				class="flex items-center border-l border-white/20 px-3 text-sm font-medium text-muted-foreground dark:border-zinc-700/40"
			>
				{unit}
			</span>
		{/if}
		<button
			type="button"
			tabindex="-1"
			aria-label="increase"
			onclick={() => bump(1)}
			class="flex items-center px-3 text-muted-foreground transition-colors hover:bg-white/30 hover:text-foreground dark:hover:bg-zinc-700/40"
		>
			<Plus class="h-4 w-4" />
		</button>
	</div>

	{#if presets?.length}
		<div class="flex flex-wrap gap-1.5">
			{#each presets as p}
				<button
					type="button"
					onclick={() => set(p.value)}
					class={cn(
						'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
						value === p.value
							? 'border-primary/40 bg-primary/20 text-primary'
							: 'glass-surface text-muted-foreground hover:text-foreground'
					)}
				>
					{p.label}
				</button>
			{/each}
		</div>
	{/if}

	{#if name}
		<input type="hidden" {name} value={value ?? ''} />
	{/if}
</div>
