<script lang="ts">
	import { ButtonGroup, GradientButton, Heading, P, Popover, Span, type ImgType } from 'flowbite-svelte';
  import { Gallery, Button } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { ArrowLeftToBracketOutline, ArrowRightToBracketOutline, MailBoxOutline, MailBoxSolid } from 'flowbite-svelte-icons';
    import Excerpt from '$lib/components/Excerpt.svelte';
  export let data: PageData;	
  import placeholder from "$lib/assets/placeholder@2x.jpg";

  let showDescription = false;
  let currentDescription = "";
  const { recipes, spirits } = data;
  const gallery = recipes?.map(item => ({ src: item.recipeImageUrl || placeholder, alt: item.recipeName})) || [] as ImgType[];
</script>

{#if !$page.data.user}
  <Heading class="mb-4 pl-2 md:pl-0" tag="h1" customSize="text-3xl font-extrabold  md:text-5xl lg:text-6xl">
    <div class="text-left md:text-center"><Span gradient gradientClass="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">More&nbsp;</Span>Than Just a Drink Menu</div>
  </Heading>
  <P class="px-2 mb-4 text-left md:text-center">Busser makes it easy to manage your inventory and keep tabs on your stock.</P>
{/if}


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
<!-- add clickable gallery -->
<Gallery items={gallery} class="gap-4 grid-cols-2 md:grid-cols-3 mb-8" let:item>
  <div class="relative group">
    <img src={item.src} alt={item.alt} class="w-full h-auto rounded-lg" />
    <div class="absolute inset-0 bg-black bg-opacity-60 flex justify-center items-center text-center text-white p-4 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div>
        <!-- Item Name in bold -->
        <a class="font-bold text-lg" href="/home">{item.alt}</a>
        
        <!-- Item Description in light text -->
        <p class="text-sm text-gray-300 mt-2">{item.alt}</p>
        
        <!-- Item Text in normal style -->
        <p class="text-xs mt-2">{item.alt}</p>
      </div>
    </div>
  </div>
</Gallery>

<!-- <Excerpt/> -->

