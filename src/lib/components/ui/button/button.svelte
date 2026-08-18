<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
		variants: {
			variant: {
				// everyday variants are translucent glass (sizing/radius still come from base/size)
				default:
					'border border-primary/30 bg-primary/85 text-primary-foreground backdrop-blur-md shadow-md shadow-primary/25 hover:bg-primary dark:bg-primary/30 dark:text-white dark:border-primary/40 dark:shadow-glow-pink dark:hover:bg-primary/45',
				destructive:
					'border border-destructive/30 bg-destructive/85 text-destructive-foreground backdrop-blur-md shadow-md shadow-destructive/25 hover:bg-destructive dark:bg-destructive/25 dark:text-white dark:hover:bg-destructive/40 dark:shadow-[0_0_12px_rgba(239,68,68,0.25)]',
				outline:
					'border border-white/30 dark:border-zinc-700/40 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:border-primary/40 hover:text-primary',
				secondary:
					'border border-white/20 dark:border-zinc-700/40 bg-secondary/20 dark:bg-secondary/15 backdrop-blur-md text-foreground hover:bg-secondary/30 dark:hover:bg-secondary/25',
				ghost: 'text-foreground hover:bg-white/40 dark:hover:bg-zinc-800/50 hover:backdrop-blur-md',
				link: 'text-primary underline-offset-4 hover:underline',
				gradient:
					'bg-gradient-to-r from-primary-500 via-primary to-secondary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 dark:hover:shadow-glow-pink',
				// liquid glass cta tier — padding/radius/font come from the unlayered .glass-cta rules in app.css
				glass: 'glass-cta',
				'glass-primary': 'glass-cta glass-cta-primary',
				'glass-secondary': 'glass-cta glass-cta-secondary',
				'glass-danger': 'glass-cta glass-cta-danger',
				'glass-warning': 'glass-cta glass-cta-warning',
			},
			size: {
				default: 'h-10 px-5 py-2',
				sm: 'h-9 px-4 text-xs',
				lg: 'h-12 px-8 text-base',
				icon: 'h-10 w-10',
				xs: 'h-8 px-3 text-xs',
				// glass sizes defer sizing to .glass-cta(-sm|-md); no height/padding utilities to avoid clashing
				glass: '',
				'glass-sm': 'glass-cta-sm',
				'glass-md': 'glass-cta-md',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		href?: string;
		children?: Snippet;
	} & (HTMLButtonAttributes & HTMLAnchorAttributes);
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		href,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	{href}
	class={cn(buttonVariants({ variant, size }), className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</svelte:element>
