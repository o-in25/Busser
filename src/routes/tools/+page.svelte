<script lang="ts">
	import type { PageData } from './$types';
	import Calculator from '$lib/components/Calculator.svelte';
	export let data: PageData;
</script>

<svelte:head>
	<title>Tools - Busser</title>
</svelte:head>
<div class="mt-5">
	<h2 class="text-3xl font-extrabold mb-4 flex flex-row justify-between">
		Tools
	</h2>
</div>
<div class="px-4 py-2 md:py-4">
	<Calculator />
</div>
