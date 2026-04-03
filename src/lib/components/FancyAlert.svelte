<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		icon,
		children,
		action,
		class: className,
	}: {
		icon?: Snippet;
		children?: Snippet;
		action?: Snippet;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'glass-alert relative overflow-hidden rounded-xl border border-white/25 dark:border-zinc-700/40 bg-white/50 dark:bg-zinc-800/40 backdrop-blur-xl backdrop-saturate-150 shadow-lg p-4 flex items-center gap-4',
		className
	)}
>
	<div class="glass-alert-shimmer"></div>

	{#if icon}
		<div class="p-2 rounded-lg bg-primary/10 shrink-0">
			{@render icon()}
		</div>
	{/if}

	<div class="flex-1 min-w-0 text-sm">
		{#if children}{@render children()}{/if}
	</div>

	{#if action}
		<div class="shrink-0">
			{@render action()}
		</div>
	{/if}
</div>

<style>
	.glass-alert {
		position: relative;
	}

	.glass-alert-shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			120deg,
			transparent 30%,
			rgba(255, 255, 255, 0.12) 50%,
			transparent 70%
		);
		background-size: 200% 100%;
		animation: alert-shimmer 4s ease-in-out infinite;
		pointer-events: none;
	}

	:global(.dark) .glass-alert-shimmer {
		background: linear-gradient(
			120deg,
			transparent 30%,
			rgba(255, 255, 255, 0.04) 50%,
			transparent 70%
		);
		background-size: 200% 100%;
	}

	@keyframes alert-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.glass-alert-shimmer {
			animation: none;
		}
	}
</style>
