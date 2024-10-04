<script lang="ts">
	import { ButtonGroup, GradientButton, Heading, P, Popover, Span } from 'flowbite-svelte';
  import { Gallery, Button } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { ArrowLeftToBracketOutline, ArrowRightToBracketOutline, MailBoxOutline, MailBoxSolid } from 'flowbite-svelte-icons';
    import Excerpt from '$lib/components/Excerpt.svelte';
  export let data: PageData;	

  const { gallery, spirits } = data.args;

</script>

<Heading class="mb-4 pl-2 md:pl-0" tag="h1" customSize="text-3xl font-extrabold  md:text-5xl lg:text-6xl">
	<div class="text-left md:text-center"><Span gradient gradientClass="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">More&nbsp;</Span>Than Just a Drink Menu</div>
</Heading>
<P class="px-2 mb-4 text-left md:text-center">Busser makes it easy to manage your inventory and keep tabs on your stock.</P>


{#if !$page.data.user}
  <div class="flex justify-center my-8">
    <ButtonGroup class="space-x-px">
      <GradientButton color="purpleToBlue" size="lg" href="/login">
        <ArrowLeftToBracketOutline/>
        <Span class="pl-1 text-white">Log In</Span>
      </GradientButton>
      <GradientButton id="btn-sign-up" color="cyanToBlue" size="lg" disabled>
        <MailBoxOutline/>
        <Span class="pl-1 text-white">Sign Up</Span>
      </GradientButton>
    </ButtonGroup>
  </div>
  <Popover class=" text-sm font-light" triggeredBy="#btn-sign-up">Coming Soon!</Popover>
{/if}
<div class="flex items-center justify-center py-4 md:py-8 flex-wrap gap-3 mb-3 mx-auto">
  {#if $page.data.user}
    <Button pill size="sm" outline>All</Button>
    {#each spirits as spirit}
      <Button pill size="sm" outline>{spirit}</Button>
    {/each}
  {/if}
</div>
<Gallery items={gallery} class="gap-4 grid-cols-2 md:grid-cols-3 mb-8" />
<Excerpt/>