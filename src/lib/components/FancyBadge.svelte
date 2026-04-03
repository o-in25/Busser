<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type BaseProps = {
		variant?: 'default' | 'primary';
		children?: Snippet;
		class?: string;
	};

	type AnchorProps = BaseProps & { href: string; as?: never } & HTMLAnchorAttributes;
	type ButtonProps = BaseProps & { href?: never; as: 'button' } & HTMLButtonAttributes;
	type DivProps = BaseProps & { href?: never; as?: never } & HTMLAttributes<HTMLDivElement>;

	let {
		variant = 'default',
		children,
		class: className,
		href,
		as,
		...restProps
	}: AnchorProps | ButtonProps | DivProps = $props();

	const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl backdrop-saturate-150 border shadow-sm transition-all duration-200';
	const defaultVariant = 'bg-white/60 dark:bg-zinc-800/40 border-white/30 dark:border-zinc-700/40';
	const primaryVariant = 'bg-primary/25 dark:bg-primary/20 border-primary/30 ring-1 ring-primary/30 shadow-[0_0_12px_rgba(248,78,128,0.25)]';
	const interactive = 'hover:bg-white/80 dark:hover:bg-zinc-800/60 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10';
	const primaryInteractive = 'hover:bg-primary/35 dark:hover:bg-primary/30 hover:shadow-[0_0_16px_rgba(248,78,128,0.35)]';

	const variantClass = $derived(variant === 'primary' ? primaryVariant : defaultVariant);
	const hoverClass = $derived(variant === 'primary' ? primaryInteractive : interactive);
</script>

{#if href}
	<a
		{href}
		class={cn(base, variantClass, hoverClass, className)}
		{...restProps as HTMLAnchorAttributes}
	>
		{#if children}{@render children()}{/if}
	</a>
{:else if as === 'button'}
	<button
		class={cn(base, variantClass, hoverClass, 'cursor-pointer', className)}
		{...restProps as HTMLButtonAttributes}
	>
		{#if children}{@render children()}{/if}
	</button>
{:else}
	<div
		class={cn(base, variantClass, className)}
		{...restProps as HTMLAttributes<HTMLDivElement>}
	>
		{#if children}{@render children()}{/if}
	</div>
{/if}
