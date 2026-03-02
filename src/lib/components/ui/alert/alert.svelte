<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	type Variant = 'default' | 'destructive' | 'success' | 'warning';

	let {
		class: className,
		variant = 'default',
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { variant?: Variant; children?: Snippet } = $props();

	const variantClasses: Record<Variant, string> = {
		default:
			'bg-white/50 dark:bg-zinc-900/50 border-white/30 dark:border-zinc-700/40 text-foreground',
		destructive:
			'bg-destructive/10 dark:bg-destructive/20 border-destructive/30 dark:border-destructive/40 text-destructive dark:text-red-400 [&>svg]:text-destructive dark:[&>svg]:text-red-400 dark:shadow-glow-pink',
		success:
			'bg-neon-green-500/10 dark:bg-neon-green-500/20 border-neon-green-500/30 dark:border-neon-green-500/40 text-neon-green-700 dark:text-neon-green-400 [&>svg]:text-neon-green-600 dark:[&>svg]:text-neon-green-400 dark:shadow-glow-green',
		warning:
			'bg-neon-yellow-500/10 dark:bg-neon-yellow-500/20 border-neon-yellow-500/30 dark:border-neon-yellow-500/40 text-neon-yellow-700 dark:text-neon-yellow-400 [&>svg]:text-neon-yellow-600 dark:[&>svg]:text-neon-yellow-400 dark:shadow-glow-amber',
	};
</script>

<div
	role="alert"
	class={cn(
		'relative w-full rounded-xl border p-4 backdrop-blur-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
		variantClasses[variant],
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
