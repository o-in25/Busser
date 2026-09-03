<script lang="ts">
	import { ChevronDown, Minus, Plus } from 'lucide-svelte';

	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';

	// glass digit-style number field with a built-in unit + optional preset chips.
	// unit is either a static suffix (pass `unit`) or a picker (also pass `units` + `onUnitChange`).
	// keeps a local text buffer so decimals like "0." can be typed without the value clobbering them.
	let {
		value = $bindable(0),
		unit,
		units,
		onUnitChange,
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
		units?: { label: string; value: string }[];
		onUnitChange?: (v: string) => void;
		min?: number;
		max?: number;
		step?: number;
		presets?: { label: string; value: number }[];
		placeholder?: string;
		name?: string;
		class?: string;
		onchange?: (v: number) => void;
	} = $props();

	let unitOpen = $state(false);

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

<div class={cn('relative space-y-2', className)}>
	<!-- h-10 to match Select triggers and text inputs for a consistent field scale -->
	<div
		class="glass-surface flex h-10 items-stretch overflow-hidden rounded-xl transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/30 dark:focus-within:shadow-glow-cyan"
	>
		<button
			type="button"
			tabindex="-1"
			aria-label="decrease"
			onclick={() => bump(-1)}
			class="flex items-center px-3 text-muted-foreground transition-colors hover:bg-white/30 hover:text-foreground dark:hover:bg-white/[0.08]"
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
			class="min-w-0 flex-1 border-0 bg-transparent text-center text-base font-semibold tabular-nums outline-none"
		/>
		{#if units?.length}
			<!-- built-in unit picker; portaled content escapes the field/card clip + z-index -->
			<Popover.Root bind:open={unitOpen}>
				<Popover.Trigger
					class="flex shrink-0 items-center gap-1 border-l border-white/20 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground dark:border-white/[0.12]"
				>
					{unit}
					<ChevronDown class="h-3.5 w-3.5 opacity-60" />
				</Popover.Trigger>
				<Popover.Content align="end" class="max-h-64 w-40 overflow-y-auto p-1">
					{#each units as u}
						<button
							type="button"
							onclick={() => {
								onUnitChange?.(u.value);
								unitOpen = false;
							}}
							class={cn(
								'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
								u.label === unit ? 'glass-primary' : 'hover:bg-accent/60'
							)}
						>
							{u.label}
						</button>
					{/each}
				</Popover.Content>
			</Popover.Root>
		{:else if unit}
			<span
				class="flex items-center border-l border-white/20 px-3 text-sm font-medium text-muted-foreground dark:border-white/[0.12]"
			>
				{unit}
			</span>
		{/if}
		<button
			type="button"
			tabindex="-1"
			aria-label="increase"
			onclick={() => bump(1)}
			class="flex items-center px-3 text-muted-foreground transition-colors hover:bg-white/30 hover:text-foreground dark:hover:bg-white/[0.08]"
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
							? 'glass-primary'
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
