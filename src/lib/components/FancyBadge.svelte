<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type BaseProps = {
		variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'verdict';
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
	const secondaryVariant = 'bg-secondary/25 dark:bg-secondary/20 border-secondary/30 ring-1 ring-secondary/30 shadow-[0_0_12px_rgba(165,125,213,0.25)]';
	const secondaryInteractive = 'hover:bg-secondary/35 dark:hover:bg-secondary/30 hover:shadow-[0_0_16px_rgba(165,125,213,0.35)]';
	const dangerVariant = 'bg-red-500/25 dark:bg-red-500/20 border-red-500/30 ring-1 ring-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.25)]';
	const dangerInteractive = 'hover:bg-red-500/35 dark:hover:bg-red-500/30 hover:shadow-[0_0_16px_rgba(239,68,68,0.35)]';
	const warningVariant = 'bg-amber-500/25 dark:bg-amber-500/20 border-amber-500/30 ring-1 ring-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
	const warningInteractive = 'hover:bg-amber-500/35 dark:hover:bg-amber-500/30 hover:shadow-[0_0_16px_rgba(245,158,11,0.35)]';
	const verdictVariant = 'border-white/20 text-white shadow-lg';
	const verdictInteractive = '';

	const variants: Record<string, string> = { default: defaultVariant, primary: primaryVariant, secondary: secondaryVariant, danger: dangerVariant, warning: warningVariant, verdict: verdictVariant };
	const hovers: Record<string, string> = { default: interactive, primary: primaryInteractive, secondary: secondaryInteractive, danger: dangerInteractive, warning: warningInteractive, verdict: verdictInteractive };

	const variantClass = $derived(variants[variant] || defaultVariant);
	const hoverClass = $derived(hovers[variant] || interactive);
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
