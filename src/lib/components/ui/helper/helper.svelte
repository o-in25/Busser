<script lang="ts">
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils';

	let {
		class: className,
		color = 'default',
		children,
		...restProps
	}: {
		class?: string;
		color?: 'default' | 'red' | 'green' | 'yellow';
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	const colorClasses: Record<string, string> = {
		default: 'text-muted-foreground',
		red: 'text-red-600 dark:text-red-400',
		green: 'text-green-600 dark:text-green-400',
		yellow: 'text-yellow-600 dark:text-yellow-400',
	};
</script>

<p class={cn('mt-1 text-sm', colorClasses[color], className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</p>
