<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { Card } from 'flowbite-svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="flex justify-center p-10">
	<Card>
		{@render children()}
	</Card>
</div>
