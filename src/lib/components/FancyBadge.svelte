<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';

	import { Badge } from '$lib/components/ui/badge';

	// thin alias over ui/badge's glass tier — keeps the original FancyBadge api intact
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

	const variantMap = {
		default: 'glass',
		primary: 'glass-primary',
		secondary: 'glass-secondary',
		danger: 'glass-danger',
		warning: 'glass-warning',
		verdict: 'glass-verdict',
	} as const;
</script>

{#if href}
	<Badge
		variant={variantMap[variant]}
		{href}
		class={className}
		{...(restProps as any)}
	>
		{#if children}{@render children()}{/if}
	</Badge>
{:else if as === 'button'}
	<Badge
		variant={variantMap[variant]}
		as="button"
		class={className}
		{...(restProps as any)}
	>
		{#if children}{@render children()}{/if}
	</Badge>
{:else}
	<Badge
		variant={variantMap[variant]}
		class={className}
		{...(restProps as any)}
	>
		{#if children}{@render children()}{/if}
	</Badge>
{/if}
