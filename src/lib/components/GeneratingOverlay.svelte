<script lang="ts">
	import { Wand2 } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	let {
		title,
		subtitle,
		progress,
		iconSize = 'w-10 h-10',
	}: {
		title: string;
		subtitle?: string;
		progress: number;
		iconSize?: string;
	} = $props();
</script>

<div
	class="absolute inset-0 z-10 flex flex-col items-center justify-center"
	transition:fade={{ duration: 200 }}
>
	<!-- animated glass background -->
	<div class="absolute inset-0 glass-generating"></div>

	<!-- content -->
	<div class="relative z-10 flex flex-col items-center gap-4 p-6 text-center">
		<div class="relative">
			<div class="absolute inset-0 animate-ping opacity-30">
				<Wand2 class="{iconSize} text-primary" />
			</div>
			<Wand2 class="{iconSize} text-primary animate-pulse" />
		</div>

		<div class="space-y-2">
			<p class="text-sm font-medium text-foreground">{title}</p>
			{#if subtitle}
				<p class="text-xs text-muted-foreground">{subtitle}</p>
			{/if}
		</div>

		<!-- progress bar -->
		<div class="w-48 h-1.5 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full overflow-hidden">
			<div
				class="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full transition-all duration-300 ease-out shimmer"
				style="width: {progress}%"
			></div>
		</div>
	</div>
</div>

<style>
	.glass-generating {
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.6) 0%,
			rgba(255, 255, 255, 0.3) 50%,
			rgba(255, 255, 255, 0.6) 100%
		);
		backdrop-filter: blur(12px);
		animation: glass-shimmer 2s ease-in-out infinite;
	}

	:global(.dark) .glass-generating {
		background: linear-gradient(
			135deg,
			rgba(39, 39, 42, 0.8) 0%,
			rgba(39, 39, 42, 0.5) 50%,
			rgba(39, 39, 42, 0.8) 100%
		);
	}

	@keyframes glass-shimmer {
		0%,
		100% {
			background-position: 0% 50%;
			opacity: 0.9;
		}
		50% {
			background-position: 100% 50%;
			opacity: 1;
		}
	}

	.shimmer {
		background-size: 200% 100%;
		animation: shimmer-move 1.5s linear infinite;
	}

	@keyframes shimmer-move {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
