<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> & { class?: string } =
		$props();
</script>

<div class={cn('-mx-1 my-1 h-px bg-muted', className)} {...restProps}></div>
