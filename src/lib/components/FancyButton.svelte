<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type BaseProps = {
		variant?: 'default' | 'primary';
		children?: Snippet;
		class?: string;
	};

	type AnchorProps = BaseProps & { href: string } & HTMLAnchorAttributes;
	type ButtonProps = BaseProps & { href?: never } & HTMLButtonAttributes;

	let {
		variant = 'default',
		children,
		class: className,
		href,
		...restProps
	}: AnchorProps | ButtonProps = $props();
</script>

{#if href}
	<a
		{href}
		class={cn('glass-cta', variant === 'primary' && 'glass-cta-primary', className)}
		{...restProps as HTMLAnchorAttributes}
	>
		{#if children}{@render children()}{/if}
	</a>
{:else}
	<button
		class={cn('glass-cta', variant === 'primary' && 'glass-cta-primary', className)}
		{...restProps as HTMLButtonAttributes}
	>
		{#if children}{@render children()}{/if}
	</button>
{/if}
