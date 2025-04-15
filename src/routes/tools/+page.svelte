<script lang="ts">
    import { Heading } from 'flowbite-svelte';
    import type { PageData } from './$types';
	  import Calculator from '$lib/components/Calculator.svelte';
    export let data: PageData;
</script>

<svelte:head>
    <title>Tools - Busser</title> 
</svelte:head>
<div class="mt-5">
  <Heading tag="h2" class="mb-4 flex flex-row justify-between font-extrabold">
    Tools
  </Heading>
</div>
<div class="px-4 py-2 md:py-4">
  <Calculator/>
</div>