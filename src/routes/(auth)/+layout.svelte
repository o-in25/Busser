<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import * as Card from '$lib/components/ui/card';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="flex justify-center p-10">
	<Card.Root class="glass-card p-6 w-full max-w-md">
		{@render children()}
	</Card.Root>
</div>
