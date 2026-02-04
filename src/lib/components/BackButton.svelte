<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';

	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	interface Props {
		fallback?: string;
		href?: string;
		label?: string;
		size?: 'icon' | 'sm' | 'default';
		variant?: 'ghost' | 'outline' | 'default';
		class?: string;
	}

	let {
		fallback = '/',
		href,
		label,
		size = 'icon',
		variant = 'ghost',
		class: className,
	}: Props = $props();

	function handleBack() {
		if (browser && window.history.length > 1) {
			history.back();
		} else {
			goto(fallback);
		}
	}

	const buttonClass = $derived(
		cn(
			buttonVariants({ variant, size: label ? size : 'icon' }),
			label && 'gap-2',
			className
		)
	);
</script>

{#if href}
	<a {href} class={buttonClass}>
		<ArrowLeft class={label && size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
		{#if label}
			<span>{label}</span>
		{/if}
	</a>
{:else}
	<button onclick={handleBack} class={buttonClass}>
		<ArrowLeft class={label && size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
		{#if label}
			<span>{label}</span>
		{/if}
	</button>
{/if}
