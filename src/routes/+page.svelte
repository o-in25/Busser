<script lang="ts">
	import { ButtonGroup, GradientButton, Heading, P, Span } from 'flowbite-svelte';
  import { Gallery, Button } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import { page } from '$app/stores';
    import { ArrowLeftToBracketOutline } from 'flowbite-svelte-icons';
  export let data: PageData;	

  const { gallery, spirits } = data.args;
  console.log(spirits)

</script>

<div class="mb-4">
<Heading class="mb-4" tag="h1" customSize="text-3xl font-extrabold  md:text-5xl lg:text-6xl">
	<div class="text-center sm:text-left"><Span gradient gradientClass="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">More&nbsp;</Span>Than Just a Drink Menu</div>
</Heading>
<P class="px-2">Busser makes it easy to manage your inventory and keep tabs on your stock.</P>
</div>


{#if !$page.data.user}
  <ButtonGroup>
    <GradientButton color="green" size="lg" href="/login">
      <ArrowLeftToBracketOutline/>
      <Span class="pl-1">Log In</Span>
    </GradientButton>
  </ButtonGroup>
{/if}
<div class="flex items-center justify-center py-4 md:py-8 flex-wrap gap-3 mb-3 mx-auto">
  {#if $page.data.user}
    <Button pill size="sm" outline>All</Button>
    {#each spirits as spirit}
      <Button pill size="sm" outline>{spirit}</Button>
    {/each}
  {/if}
</div>
<Gallery items={gallery} class="gap-4 grid-cols-2 md:grid-cols-3" />