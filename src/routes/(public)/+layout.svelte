<script lang="ts">
	import type { Snippet } from 'svelte';

	import logo from '$lib/assets/logo.png';
	import * as Card from '$lib/components/ui/card';

	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="min-h-[calc(100vh-80px)] flex flex-col items-center px-4 py-8">
	<!-- Logo links back to home (only shown when not signed in) -->
	{#if !data.user}
		<a href="/" class="hover:opacity-80 transition-opacity mb-6">
			<img src={logo} alt="Busser" class="h-24 md:h-32" />
		</a>
	{/if}

	<Card.Root class="glass-card p-6 md:p-8 w-full max-w-3xl">
		{@render children()}
	</Card.Root>
</div>
