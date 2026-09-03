<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';

	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';

	import { workspaceSwitching } from '../../stores';

	// hero stat badge that shimmers over the whole pill on workspace switch. content stays hidden in
	// the dom so the pill keeps its width and nothing reflows.
	type BaseProps = {
		variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'verdict';
		children?: Snippet;
		class?: string;
	};
	type AnchorProps = BaseProps & { href: string; as?: never } & HTMLAnchorAttributes;
	type ButtonProps = BaseProps & { href?: never; as: 'button' } & HTMLButtonAttributes;
	type DivProps = BaseProps & { href?: never; as?: never } & HTMLAttributes<HTMLDivElement>;

	let { children, class: className, ...rest }: AnchorProps | ButtonProps | DivProps = $props();
</script>

<Badge size="lg"
	class={cn('relative', $workspaceSwitching && 'pointer-events-none', className)}
	{...rest as any}
>
	<span class={cn('contents', $workspaceSwitching && 'invisible')}>
		{#if children}{@render children()}{/if}
	</span>
	{#if $workspaceSwitching}
		<span class="shimmer absolute inset-0 rounded-full" aria-hidden="true"></span>
	{/if}
</Badge>

<style>
	/* same sweeping highlight as the results skeletons — keeps the switch gesture consistent */
	.shimmer {
		background: linear-gradient(
			90deg,
			hsl(var(--muted)) 25%,
			hsl(var(--muted-foreground) / 0.15) 50%,
			hsl(var(--muted)) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shimmer {
			animation: none;
		}
	}
</style>
