<script lang="ts">
    import type { Product } from "$lib/types";
    import { ImagePlaceholder, P, Heading, ButtonGroup, GradientButton, ScoreRating } from "flowbite-svelte";
    import { EditOutline, TrashBinOutline } from "flowbite-svelte-icons";
    export let product: Product;

  let headerLabel = {
    desc1: '8.7',
    desc2: 'Excellent',
    desc3: '',
    link: {
      label: 'Read all reviews',
      url: '/'
    }
  };

  const fakeRatings = () => {
    let vec: number[] = [];
    for(let i = 0; i < 4; i++) {
      const randomRating = Math.floor(Math.random() * (1000 - 100) + 100) / 100;
      vec.push(randomRating)
    }
    let ratings = [
      { label: 'Taste', rating: vec[0] },
      { label: 'Smoothness', rating: vec[1] },
    ]

    let ratings2 = [
      { label: 'Cost', rating: vec[2] },
      { label: 'Versatility', rating: vec[3] },
    ]

    let avg = Math.round((vec.reduce((acc, curr) => acc + curr, 0) / vec.length) * 10) / 10
    if(avg <= 1) {
        //'dark:bg-red-500 bg-red-500'
      return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Swill',
        style: 'dark:bg-red-500 bg-red-500'
      }
    }
    if(avg <= 2) {
        //'dark:bg-red-500 bg-red-500'
      return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Forgettable',
        style: 'dark:bg-red-500 bg-red-500'
      }
    }
    
    if(avg <= 3) {
        //'dark:bg-red-500 bg-red-500'
      return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Bottom Shelf',
        style: 'dark:bg-red-500 bg-red-500'
      }
    }

    if(avg <= 4) {
        //'dark:bg-red-500 bg-red-500'
      return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Decent',
        style: 'dark:bg-yellow-500 bg-yellow-500'
      }
    }

    if(avg <= 5) {
        //'dark:bg-red-500 bg-red-500'
      return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Standard Pour',
        style: 'dark:bg-yellow-500 bg-yellow-500'
      }
    }

    if(avg <= 6) {
        //'dark:bg-red-500 bg-red-500'
      return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Good Stuff',
        style: 'dark:bg-green-500 bg-green-500'
      }
    }

    if(avg <= 7) {
        //'dark:bg-red-500 bg-red-500'
      return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Top Shelf',
        style: 'dark:bg-green-500 bg-green-500'
      }
    }

    if(avg <= 8) {
        //'dark:bg-red-500 bg-red-500'
      return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Connoisseur\'s Choice',
        style: 'dark:bg-green-500 bg-green-500'
      }
    }

    if(avg <= 9) {
        //'dark:bg-red-500 bg-red-500'
      return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Bartender\'s Favorite',
        style: 'dark:bg-blue-500 bg-blue-500'
      }
    }

    return { 
        ratings, 
        ratings2,
        desc1: avg.toFixed(1),
        desc2: 'Best in House',
        style: 'dark:bg-violet-500 bg-violet-500'
      }
    
  }

  const { ratings, ratings2, desc1, desc2, style } = fakeRatings();

</script>


{#if product}
  <div class="space-y-4 text-wrap w-full p-4">
    <div class="flex">
      <img class="rounded object-fit h-48 w-44" src="{product.productImageUrl}" alt="Image of {product.productName}">
      <div class="flex-auto w-64 px-4 pt-4 relative">
        <Heading tag="h6">
          {#if product.productName !== product.categoryName}
            {product.productName} - {product.categoryName}
          {:else}
            {product.productName}
          {/if}
        </Heading>
        <P weight="extralight">{product.categoryDescription}</P>
        <ButtonGroup class="*:!ring-primary-700 absolute bottom-0">
          <GradientButton color="purpleToBlue"><EditOutline/></GradientButton>
          <GradientButton color="pinkToOrange"><TrashBinOutline/></GradientButton>
        </ButtonGroup>
      </div>
      <div class="flex-grow w-64">
        <ScoreRating
          desc1Class="w-8 text-sm font-semibold inline-flex items-center p-1.5 rounded {style}"
          linkClass="hidden"
          headerLabel={{...headerLabel, desc1, desc2}}
          ratings={ratings}
          ratings2={ratings2}
        />
      </div>

      <!-- <div class="p-4">
        <p>{product.categoryDescription}</p>
        <P class="mb-3 md:text-xl" weight="light" size="lg" color="text-gray-500 dark:text-gray-400">
          {product.productName} - {product.categoryName}
        </P>
        <P weight="light" color="text-gray-500 dark:text-gray-400">{product.categoryDescription}</P> 
      </div> -->
    </div>
  </div>
{:else}
  <ImagePlaceholder />
{/if}





