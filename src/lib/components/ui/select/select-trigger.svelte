<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { ChevronDown } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	let { class: className, children, ...restProps }: SelectPrimitive.TriggerProps = $props();
</script>

<SelectPrimitive.Trigger
	class={cn(
		'glass-field group flex h-10 w-full items-center justify-between gap-2 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 data-[state=open]:ring-2 data-[state=open]:ring-primary/25 data-[state=open]:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
	<ChevronDown
		class="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180"
	/>
</SelectPrimitive.Trigger>
