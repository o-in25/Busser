<script lang="ts">
  import type { Product } from "$lib/types";
  import { ImagePlaceholder, P, Heading, ButtonGroup, GradientButton, ScoreRating, Badge, Progressbar } from "flowbite-svelte";
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

  
  const parseSize = (ml: number) => {
    if(ml === 0) return 'N/A'
    if(ml < 1000) return `${ml} ML`
    return  `${ml / 1000} L`
  }

  const { ratings, ratings2, desc1, desc2, style } = fakeRatings();

</script>

<!-- "grid gap-6 mb-6 md:grid-cols-2 -->
{#if product}
  <div class="space-y-2 text-wrap w-full">
    <div class="mb-6 grid gap-6 grid-cols-1 md:grid-cols-2">
        <!-- col 1 -->
        <div class="flex px-2 pt-4 md:pb-4">
          <img class="rounded object-fit h-48 w-44 mr-2" src="{product.productImageUrl}" alt="Image of {product.productName}">
          <div class="flex flex-col">
            <div class="pb-2">
              {#if product.productInStockQuantity < 1}<Badge color="red" class="sm:hidden">Out of Stock</Badge>{/if}
              <Heading tag="h6">{product.productName}</Heading>
              <P weight="extralight">{product.categoryDescription}</P>
            </div>

            <!-- desktop only -->
            <div class="flex flex-grow">
                <ButtonGroup divClass="inline-flex rounded-lg shadow-sm mt-auto">
                  <GradientButton color="blue" href="/inventory/{product.productId}/edit"><EditOutline/></GradientButton>
                  <GradientButton color="red"><TrashBinOutline/></GradientButton>
                </ButtonGroup>
            </div>
          </div>
        </div>
        <!-- mobile only -->
        <!-- <div class="flex sm:hidden">
          <div class="flex-grow my-auto mt-4">
            <Badge color="dark">{product.categoryName}</Badge>
            <Badge color="dark">${product.productPricePerUnit}</Badge>
            <Badge color="dark">{parseSize(product.productUnitSizeInMilliliters)}</Badge> 
          </div>
        </div> -->
        <!-- col 2 -->
        <div class="px-2 pt-4 md:pb-4">
          <ScoreRating
            desc1Class="w-8 text-sm font-semibold inline-flex items-center p-1.5 rounded {style}"
            linkClass="hidden"
            headerLabel={{...headerLabel, desc1, desc2}}
            ratings={ratings}
            ratings2={ratings2}
          />
        </div>
    </div>
  </div>
{:else}
  <!-- <ImagePlaceholder /> -->
{/if}





