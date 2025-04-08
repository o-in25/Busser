<script lang="ts">
	import { A, ButtonGroup, GradientButton, Heading, P, Popover, Span, type ImgType } from 'flowbite-svelte';
  import { Gallery, Button } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { ArrowLeftToBracketOutline, ArrowRightOutline, ArrowRightToBracketOutline, MailBoxOutline, MailBoxSolid } from 'flowbite-svelte-icons';
    import Excerpt from '$lib/components/Excerpt.svelte';
  export let data: PageData;	
  import placeholder from "$lib/assets/placeholder@2x.jpg";
	import { getContext } from 'svelte';

  const { recipes, spirits } = data;
  const gallery = recipes?.map(({ recipeImageUrl, recipeName, ...rest}) => ({ 
    src: recipeImageUrl || placeholder, 
    alt: recipeName,
    data: { ...rest }
  })) || [] as ImgType[];

  const getData = (key: any, val: any) => (val?.data as any)?.[key]
  const permissions: string[] = getContext('permissions');

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
    <div class="relative group flex justify-center items-center">
      <img src={item.src} alt={item.alt} class="h-full object-cover w-full rounded-lg" />
      <div class="absolute inset-0 right-0 bg-black bg-opacity-60 flex justify-center items-center text-center text-white p-4 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div class="text-center">
          <p class="font-bold text-lg">
            {item.alt} <span class="mx-1 text-xl text-white-400">&bull;</span> {getData('recipeCategoryDescription', item)}
          </p>
          <!-- <p class="text-sm text-gray-300 mt-2">{getData('recipeCategoryDescription', item)}</p> -->
          <p class="text-xs mt-2">{getData('recipeDescription', item)}</p>
          <!-- TODO: eventually we will let all users go here -->
           {#if permissions.includes('view_catalog')}
            <div class="flex justify-center">
              <A aClass="mx-autofont-medium hover:underline flex items-center py-2" href="/catalog/{getData('recipeId', item)}}">Open In Catalog<ArrowRightOutline class="ms-1 h-5 w-5"/>
              </A>
            </div>
          {/if}
        </div>
      </div>
    </div>

</Gallery>


