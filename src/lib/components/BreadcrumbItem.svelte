<script>
	import { ChevronRight } from 'lucide-svelte';
	export let name;
	export let href = '';
</script>

<li class="inline-flex items-center">
	<div class="text-muted-foreground">
		<ChevronRight class="w-4 h-4" />
	</div>
	{#if href}
		<a {href} class="ms-1 text-sm font-medium text-muted-foreground hover:text-primary md:ms-2">
			{name}
		</a>
	{:else}
		<span class="ms-1 text-sm font-medium text-muted-foreground md:ms-2">
			{name}
		</span>
	{/if}
</li>
