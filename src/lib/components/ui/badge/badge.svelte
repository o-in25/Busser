<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	// glass is the baseline: variant picks color, size picks chip (sm) vs pill (lg). no solid-fill tier.
	export const badgeVariants = tv({
		base: 'inline-flex items-center rounded-full border font-semibold backdrop-blur-xl backdrop-saturate-150 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
		variants: {
			variant: {
				default:
					'bg-white/60 dark:bg-white/[0.08] border-white/30 dark:border-white/[0.12] text-foreground hover:bg-white/80 dark:hover:bg-white/[0.14]',
				primary:
					'bg-primary/25 dark:bg-primary/20 border-primary/30 ring-1 ring-primary/30 text-foreground shadow-[0_0_12px_rgba(248,78,128,0.25)] hover:bg-primary/35 dark:hover:bg-primary/30',
				secondary:
					'bg-secondary/25 dark:bg-secondary/20 border-secondary/30 ring-1 ring-secondary/30 text-foreground shadow-[0_0_12px_rgba(165,125,213,0.25)] hover:bg-secondary/35 dark:hover:bg-secondary/30',
				danger:
					'bg-red-500/25 dark:bg-red-500/20 border-red-500/30 ring-1 ring-red-500/30 text-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)] hover:bg-red-500/35 dark:hover:bg-red-500/30',
				warning:
					'bg-amber-500/25 dark:bg-amber-500/20 border-amber-500/30 ring-1 ring-amber-500/30 text-foreground shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:bg-amber-500/35 dark:hover:bg-amber-500/30',
				success:
					'bg-neon-green-500/20 border-neon-green-500/30 ring-1 ring-neon-green-500/30 text-foreground shadow-[0_0_12px_rgba(34,197,94,0.25)] hover:bg-neon-green-500/30',
				outline:
					'border-white/30 dark:border-white/[0.12] text-foreground hover:bg-white/40 dark:hover:bg-white/[0.08]',
				verdict: 'border-white/20 text-white shadow-lg',
			},
			size: {
				sm: 'gap-1 px-2.5 py-0.5 text-xs',
				lg: 'gap-2 px-4 py-2 text-sm',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'sm',
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
	export type BadgeSize = VariantProps<typeof badgeVariants>['size'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		variant = 'default',
		size = 'sm',
		href,
		as,
		children,
		...restProps
	}: {
		class?: string;
		variant?: BadgeVariant;
		size?: BadgeSize;
		href?: string;
		as?: 'button' | 'div';
		children?: Snippet;
	} & HTMLAttributes<HTMLElement> = $props();

	const element = $derived(href ? 'a' : as === 'button' ? 'button' : 'div');
	const interactive = $derived(!!href || as === 'button');
</script>

<svelte:element
	this={element}
	{href}
	class={cn(badgeVariants({ variant, size }), interactive && 'cursor-pointer', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</svelte:element>
