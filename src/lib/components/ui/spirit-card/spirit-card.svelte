<script lang="ts">
	import type { Spirit } from '$lib/types';
	import { cn } from '$lib/utils';
	import { cdnSrc } from '$lib/utils/image';

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
			'relative flex h-24 flex-col justify-end overflow-hidden rounded-xl border-2 transition-all duration-200 backdrop-blur-md backdrop-saturate-150',
			selected
				? 'border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/10'
				: 'border-white/20 dark:border-white/[0.12] hover:border-primary/50'
		)}
	>
		<!-- backdrop: category image faded into the card, glass fallback when none -->
		<div class="absolute inset-0">
			{#if spirit.recipeCategoryDescriptionImageUrl}
				<img
					src={cdnSrc(spirit.recipeCategoryDescriptionImageUrl, 384)}
					alt=""
					loading="lazy"
					class="h-full w-full object-cover"
				/>
			{:else}
				<div class="h-full w-full bg-white/40 dark:bg-white/[0.08]"></div>
			{/if}
			<div
				class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"
			></div>
			{#if selected}
				<div class="absolute inset-0 bg-primary/10"></div>
			{/if}
		</div>

		<span
			class={cn(
				'relative z-10 px-3 pb-2 text-left text-sm font-semibold transition-colors',
				selected ? 'text-primary' : 'text-foreground'
			)}
		>
			{spirit.recipeCategoryDescription}
		</span>

		{#if selected}
			<div
				class="absolute top-2 right-2 z-10 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md"
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
