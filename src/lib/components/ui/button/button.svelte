<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
		variants: {
			variant: {
				// default is neutral glass; primary is the pink CTA (opt-in). colored variants below.
				default: 'glass-button',
				primary: 'glass-primary',
				destructive: 'glass-destructive',
				outline: 'glass-button',
				secondary: 'glass-secondary',
				ghost:
					'text-foreground hover:bg-white/40 dark:hover:bg-white/[0.10] hover:backdrop-blur-md hover:backdrop-saturate-150',
				link: 'text-primary underline-offset-4 hover:underline',
				// yellow tertiary tier — pink primary, purple secondary, neon-yellow tertiary
				tertiary: 'glass-tertiary',
				// marketing cta pill — login/signup/landing only; sizing comes from .glass-cta in app.css
				cta: 'glass-cta',
				'cta-primary': 'glass-cta glass-cta-primary',
				'cta-secondary': 'glass-cta glass-cta-secondary',
				'cta-danger': 'glass-cta glass-cta-danger',
				'cta-warning': 'glass-cta glass-cta-warning',
			},
			size: {
				default: 'h-10 px-5 py-2',
				sm: 'h-9 px-4 text-xs',
				lg: 'h-12 px-8 text-base',
				icon: 'h-10 w-10 rounded-full',
				// cta pill sizes defer to .glass-cta(-sm) so height/padding don't clash
				cta: '',
				'cta-sm': 'glass-cta-sm',
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
