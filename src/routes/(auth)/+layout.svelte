<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import logo from '$lib/assets/logo.png';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-6 md:py-10">
	<!-- Logo links back to home -->
	<a href="/" class="mb-4 md:mb-6 hover:opacity-80 transition-opacity">
		<img src={logo} alt="Busser" class="h-16 md:h-20" />
	</a>

	<Card.Root class="glass-card p-4 md:p-6 w-full max-w-md">
		{@render children()}
	</Card.Root>
</div>
