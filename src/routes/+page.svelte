<script lang="ts">
	import { A, ButtonGroup, GradientButton, Heading, Hr, P, Popover, Span, Spinner, type ImgType } from 'flowbite-svelte';
  import { Gallery, Button } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { ArrowLeftToBracketOutline, ArrowRightOutline, ArrowRightToBracketOutline, ChevronRightOutline, MailBoxOutline, MailBoxSolid } from 'flowbite-svelte-icons';
    import Excerpt from '$lib/components/Excerpt.svelte';
  export let data: PageData;	
  import placeholder from "$lib/assets/placeholder@2x.jpg";
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';

  const { recipes, spirits } = data;

  const permissions: string[] = getContext('permissions');

  const gallery = recipes?.map(({ recipeImageUrl, recipeName, recipeCategoryDescription, recipeId, recipeCategoryId, recipeDescription}) => ({ 
    src: recipeImageUrl || placeholder, 
    alt: recipeName,
    data: { 
      recipeCategoryDescription,
      recipeId,
      recipeCategoryId,
      recipeDescription
    }
  })) || [];

  let loading = false;
  const getData = (key: any, val: any) => (val?.data as any)?.[key];
  let sortBy: string | number = 'all';
  $: filter = sortBy === 'all'? gallery : gallery.filter((item: any ) => item.data.recipeCategoryId === sortBy)


const setFilterType = (type: any) => {
  if(type !== sortBy) {
    sortBy = type;
    // loading = true;
    // setTimeout(() => (loading = false), 350)
  }
}
</script>

{#if !$page.data.user}
  <Heading class="mb-4 pl-2 md:pl-0" tag="h1" customSize="text-3xl font-extrabold  md:text-5xl lg:text-6xl">
    <div class="text-center md:text-left">From Shelf To&nbsp;<Span gradient gradientClass="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-pink-400">Shaker</Span></div>
  </Heading>
  <P class="px-2 mb-4 text-center md:text-left">Busser finds recipes that match your on-hand ingredients, no guesswork needed.</P>
{:else}
  <div class="mt-5 mb-4">
    <Heading tag="h2" class="flex flex-row justify-between font-extrabold">
      Ready-to-Make Recipes
    </Heading>
  </div>
{/if}

{#if !$page.data.user}
  <div class="flex justify-center md:justify-start my-8">
    <ButtonGroup class="space-x-px">
      <GradientButton color="purpleToPink" size="lg" href="/login">
        <ArrowLeftToBracketOutline/>
        <Span class="pl-1 text-white">Sign In</Span>
      </GradientButton>
      <GradientButton id="btn-sign-up" color="pinkToOrange" size="lg" disabled>
        <MailBoxOutline/>
        <Span class="pl-1 text-white">Sign Up</Span>
      </GradientButton>
    </ButtonGroup>
  </div>
  <Popover class=" text-sm font-light" triggeredBy="#btn-sign-up">Coming Soon!</Popover>
  <Hr/>

{/if}

<div class="flex items-center justify-center pb-4 md:pb-8 flex-wrap gap-3 mb-3 mx-auto">
  <Button pill size="sm" outline={!(sortBy === 'all')} on:click={() => setFilterType('all')}>All</Button>
  {#each spirits as spirit}
    <Button pill size="sm" outline={!(sortBy === spirit.recipeCategoryId)} on:click={() => setFilterType(spirit.recipeCategoryId)}>{spirit.recipeCategoryDescription}</Button>
  {/each}
</div>

{#if !loading}
  <Gallery items={filter} class="gap-4 grid-cols-2 md:grid-cols-3 mb-8" let:item>
      <div class="relative group flex justify-center items-center" in:fade={{ duration: 500 }} out:fade={{ duration: 500 }}>
        <img src={item.src} alt={item.alt} class="h-full object-cover w-full rounded-lg"/>
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
                <A aClass="mx-autofont-medium hover:underline flex items-center py-2" href="/catalog/{getData('recipeId', item)}}">Open in catalog<ArrowRightOutline class="ms-1 h-5 w-5"/>
                </A>
              </div>
            {/if}
          </div>
        </div>
      </div>
  </Gallery>
{:else}
<div class="my-8 text-center">
  <Spinner size={8} />
 </div>
{/if}


