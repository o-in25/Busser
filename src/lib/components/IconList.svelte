<script lang="ts">
	import { CircleCheck, CircleX } from 'lucide-svelte';
	export let type: 'success' | 'error';
	export let heading: string;
	export let list: string[];
	export let maxItems: number = 3;
	$: list = list.slice(0, maxItems);
</script>

<h6 class="text-md font-semibold text-foreground">
	{heading}
</h6>
<ul class="space-y-1 text-muted-foreground">
	{#each list as item}
		<li class="flex items-center">
			{#if type === 'success'}
				<CircleCheck class="w-5 h-5 me-2 text-green-500 dark:text-green-400" />
			{:else if type === 'error'}
				<CircleX class="w-5 h-5 me-2 text-red-500 dark:text-red-400" />
			{/if}
			{item}
		</li>
	{/each}
</ul>
