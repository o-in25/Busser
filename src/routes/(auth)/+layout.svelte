<script lang="ts">
	import type { Snippet } from 'svelte';

	import logo from '$lib/assets/logo.png';
	import * as Card from '$lib/components/ui/card';

	let { children }: { children: Snippet } = $props();
</script>

<div
	class="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-2 pb-6 md:px-4 md:pb-10"
>
	<!-- Logo links back to home (logo's built-in whitespace serves as top padding) -->
	<a href="/" class="hover:opacity-80 transition-opacity">
		<img src={logo} alt="Busser" class="h-24 md:h-32" />
	</a>

	<Card.Root class="glass-card p-4 md:p-6 w-full max-w-md">
		{@render children()}
	</Card.Root>
</div>
