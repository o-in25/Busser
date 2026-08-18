<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/ui/button';

	// thin alias over ui/button's glass cta tier — keeps the original FancyButton api intact
	type BaseProps = {
		variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'warning';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		children?: Snippet;
		class?: string;
	};

	type AnchorProps = BaseProps & { href: string } & HTMLAnchorAttributes;
	type ButtonProps = BaseProps & { href?: never } & HTMLButtonAttributes;

	let {
		variant = 'default',
		size = 'lg',
		disabled = false,
		children,
		class: className,
		href,
		...restProps
	}: AnchorProps | ButtonProps = $props();

	const variantMap = {
		default: 'glass',
		primary: 'glass-primary',
		secondary: 'glass-secondary',
		danger: 'glass-danger',
		warning: 'glass-warning',
	} as const;

	const sizeMap = { sm: 'glass-sm', md: 'glass-md', lg: 'glass' } as const;
</script>

{#if href}
	<Button
		variant={variantMap[variant]}
		size={sizeMap[size]}
		href={disabled ? undefined : href}
		class={className}
		aria-disabled={disabled || undefined}
		tabindex={disabled ? -1 : undefined}
		{...(restProps as any)}
	>
		{#if children}{@render children()}{/if}
	</Button>
{:else}
	<Button
		variant={variantMap[variant]}
		size={sizeMap[size]}
		{disabled}
		class={className}
		{...(restProps as any)}
	>
		{#if children}{@render children()}{/if}
	</Button>
{/if}
