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
			'relative flex flex-col items-center rounded-xl border-2 transition-all duration-200 overflow-hidden',
			'bg-white dark:bg-gray-800',
			selected
				? 'border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/10'
				: 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
		)}
	>
		<!-- Image container - fills the card -->
		<div
			class="relative w-full aspect-[4/3] bg-white dark:bg-gray-200 flex items-center justify-center p-2"
		>
			{#if selected}
				<div class="absolute inset-0 bg-primary/5 z-10"></div>
			{/if}
			<img
				src={spirit.recipeCategoryDescriptionImageUrl}
				alt={spirit.recipeCategoryDescription}
				class="max-w-full max-h-full object-contain relative z-10"
			/>
			<!-- Dark mode overlay - darkens white backgrounds while preserving bottle colors -->
			<div
				class="absolute inset-0 bg-gray-400 mix-blend-multiply opacity-0 dark:opacity-30 pointer-events-none"
			></div>
		</div>

		<!-- Label bar at bottom -->
		<div
			class={cn(
				'w-full py-2 px-3 text-center border-t transition-colors',
				selected
					? 'bg-primary/10 border-primary/20'
					: 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600'
			)}
		>
			<span
				class={cn(
					'text-sm font-medium truncate block transition-colors',
					selected ? 'text-primary' : 'text-muted-foreground'
				)}
			>
				{spirit.recipeCategoryDescription}
			</span>
		</div>

		<!-- Selected indicator -->
		{#if selected}
			<div
				class="absolute top-2 right-2 z-20 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md"
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
