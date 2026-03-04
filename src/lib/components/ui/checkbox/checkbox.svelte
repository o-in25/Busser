<script lang="ts">
	import { Check } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	let {
		class: className,
		checked = $bindable(false),
		disabled = false,
		onchange,
		...restProps
	}: {
		class?: string;
		checked?: boolean;
		disabled?: boolean;
		onchange?: (checked: boolean) => void;
		[key: string]: unknown;
	} = $props();

	function toggle() {
		if (disabled) return;
		checked = !checked;
		onchange?.(checked);
	}
</script>

<button
	type="button"
	role="checkbox"
	aria-checked={checked}
	{disabled}
	class={cn(
		'peer inline-flex items-center justify-center h-4 w-4 p-0 shrink-0 rounded-md border-2 ring-offset-background transition-all duration-150',
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
		'disabled:cursor-not-allowed disabled:opacity-50',
		checked
			? 'border-primary bg-primary text-primary-foreground shadow-sm'
			: 'border-muted-foreground/40 bg-background hover:border-primary/70',
		className
	)}
	onclick={toggle}
	{...restProps}
>
	{#if checked}
		<Check class="h-3 w-3" strokeWidth={3} />
	{/if}
</button>
