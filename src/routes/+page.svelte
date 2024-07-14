<script lang="ts">
	import { Heading, P, Span } from 'flowbite-svelte';
  import { Gallery, Button } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  export let data: PageData;	

  const { gallery, spirits } = data.args;
</script>

<Heading
	tag="h1"
	class="mb-4"
	customSize="text-3xl font-extrabold  md:text-5xl lg:text-6xl"
>
	<Span gradient>More&nbsp;</Span>Than Just a Drink Menu
</Heading>
<P>Busser makes it easy to manage your inventory and keep tabs on your stock. {#if !$page.data.user}Sign up today.{/if}</P>
<div class="flex items-center justify-center py-4 md:py-8 flex-wrap gap-3 mb-3 mx-auto">
  {#if $page.data.user}
    <Button pill size="xl" outline>All</Button>
    {#each spirits as spirit}
      <Button pill size="xl" outline>{spirit}</Button>
    {/each}
  {/if}
</div>

<Gallery items={gallery} class="gap-4 grid-cols-2 md:grid-cols-3" />