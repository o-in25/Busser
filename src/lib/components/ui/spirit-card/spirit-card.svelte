<script lang="ts">
	import type { Spirit } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		class: className,
		spirit,
		selected = false,
		name = 'recipeCategoryId',
		onselect,
		...restProps
	}: {
		class?: string;
		spirit: Spirit;
		selected?: boolean;
		name?: string;
		onselect?: (spirit: Spirit) => void;
		[key: string]: unknown;
	} = $props();

	function handleClick() {
		onselect?.(spirit);
	}
</script>

<label class={cn('cursor-pointer', className)} {...restProps}>
	<input
		type="radio"
		{name}
		value={spirit.recipeCategoryId}
		checked={selected}
		onchange={handleClick}
		class="sr-only peer"
	/>
	<div
		class={cn(
			'relative flex items-center justify-center rounded-xl border-2 transition-all duration-200 px-4 py-5 min-h-[72px] text-center backdrop-blur-md',
			selected
				? 'border-primary bg-primary/10 ring-4 ring-primary/20 shadow-lg shadow-primary/10'
				: 'border-white/20 dark:border-zinc-700/40 bg-white/40 dark:bg-zinc-800/40 hover:border-primary/50'
		)}
	>
		<span
			class={cn(
				'text-sm font-medium transition-colors',
				selected ? 'text-primary' : 'text-foreground'
			)}
		>
			{spirit.recipeCategoryDescription}
		</span>

		{#if selected}
			<div
				class="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md"
			>
				<svg class="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
		{/if}
	</div>
</label>
