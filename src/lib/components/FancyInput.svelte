<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';

	// thin alias over the unified glass-surface ui/input, keeping the original pill shape
	let {
		class: className,
		value = $bindable(),
		...restProps
	}: HTMLInputAttributes & { value?: string } = $props();
</script>

<Input bind:value class={cn('rounded-full', className)} {...restProps} />
