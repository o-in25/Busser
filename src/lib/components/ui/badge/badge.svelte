<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
		variants: {
			variant: {
				// everyday badge is translucent glass (pink), mirroring the button default treatment
				default:
					'border-primary/30 bg-primary/85 text-primary-foreground backdrop-blur-md shadow-md shadow-primary/25 hover:bg-primary dark:bg-primary/30 dark:text-white dark:border-primary/40 dark:shadow-glow-pink dark:hover:bg-primary/45',
				// purple glass counterpart to the pink default
				secondary:
					'border-secondary/30 bg-secondary/85 text-secondary-foreground backdrop-blur-md shadow-md shadow-secondary/25 hover:bg-secondary dark:bg-secondary/30 dark:text-white dark:border-secondary/40 dark:shadow-glow-purple dark:hover:bg-secondary/45',
				destructive:
					'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
				outline: 'text-foreground',
				success: 'border-transparent bg-neon-green-500 text-white hover:bg-neon-green-600',
				warning: 'border-transparent bg-neon-yellow-500 text-white hover:bg-neon-yellow-600',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

	// liquid glass badge tier — mirrors the former FancyBadge treatment, kept as a self-contained
	// path so the existing solid badge variants above stay byte-for-byte unchanged
	export const glassBadgeBase =
		'inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl backdrop-saturate-150 border shadow-sm transition-all duration-200';
	export const glassBadgeVariants = {
		glass: 'bg-white/60 dark:bg-zinc-800/40 border-white/30 dark:border-zinc-700/40',
		'glass-primary':
			'bg-primary/25 dark:bg-primary/20 border-primary/30 ring-1 ring-primary/30 shadow-[0_0_12px_rgba(248,78,128,0.25)]',
		'glass-secondary':
			'bg-secondary/25 dark:bg-secondary/20 border-secondary/30 ring-1 ring-secondary/30 shadow-[0_0_12px_rgba(165,125,213,0.25)]',
		'glass-danger':
			'bg-red-500/25 dark:bg-red-500/20 border-red-500/30 ring-1 ring-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.25)]',
		'glass-warning':
			'bg-amber-500/25 dark:bg-amber-500/20 border-amber-500/30 ring-1 ring-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
		'glass-verdict': 'border-white/20 text-white shadow-lg',
	} as const;
	export const glassBadgeHover = {
		glass:
			'hover:bg-white/80 dark:hover:bg-zinc-800/60 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10',
		'glass-primary':
			'hover:bg-primary/35 dark:hover:bg-primary/30 hover:shadow-[0_0_16px_rgba(248,78,128,0.35)]',
		'glass-secondary':
			'hover:bg-secondary/35 dark:hover:bg-secondary/30 hover:shadow-[0_0_16px_rgba(165,125,213,0.35)]',
		'glass-danger':
			'hover:bg-red-500/35 dark:hover:bg-red-500/30 hover:shadow-[0_0_16px_rgba(239,68,68,0.35)]',
		'glass-warning':
			'hover:bg-amber-500/35 dark:hover:bg-amber-500/30 hover:shadow-[0_0_16px_rgba(245,158,11,0.35)]',
		'glass-verdict': '',
	} as const;
	export type GlassBadgeVariant = keyof typeof glassBadgeVariants;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		variant = 'default',
		href,
		as,
		children,
		...restProps
	}: {
		class?: string;
		variant?: BadgeVariant | GlassBadgeVariant;
		href?: string;
		as?: 'button' | 'div';
		children?: Snippet;
	} & HTMLAttributes<HTMLElement> = $props();

	const isGlass = $derived(typeof variant === 'string' && variant.startsWith('glass'));
	const element = $derived(href ? 'a' : as === 'button' ? 'button' : 'div');
	const interactive = $derived(!!href || as === 'button');

	const classes = $derived(
		isGlass
			? cn(
					glassBadgeBase,
					glassBadgeVariants[variant as GlassBadgeVariant],
					interactive && glassBadgeHover[variant as GlassBadgeVariant],
					interactive && 'cursor-pointer',
					className
				)
			: cn(
					badgeVariants({ variant: variant as BadgeVariant }),
					interactive && 'cursor-pointer',
					className
				)
	);
</script>

<svelte:element this={element} {href} class={classes} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</svelte:element>
