<script lang="ts">
  import type { Product } from "$lib/types";
  import placeholder from "$lib/assets/placeholder@2x.jpg";

  import {
    ImagePlaceholder,
    A,
    Heading,
    ScoreRating,
    Badge,
    Card,
    Secondary,
    Popover,
		Button,
  } from "flowbite-svelte";
  import {
    ArrowRightOutline,
    ChevronRightOutline,
    EditOutline,
    HeartOutline,
    InfoCircleSolid,
  } from "flowbite-svelte-icons";
  import FancyButton from "./FancyButton.svelte";
	import { weightedMean } from "$lib/math";
	import { getContext } from "svelte";
	import Catalog from "./Catalog.svelte";
  export let product: Product;

  let headerLabel = {
    desc1: "8.7",
    desc2: "Excellent",
    desc3: "",
    link: {
      label: "Read all reviews",
      url: "/",
    },
  };

  const permissions: string[] = getContext('permissions');

  // fallback if image cant load 
  let productImage = product?.productImageUrl || placeholder;
  const imageLoadError = () => productImage = placeholder

  const generateRatings = () => {
    const ratings = [
      { label: "Dryness", rating: product.productDrynessRating || 0.0 },
      { label: "Sweetness", rating: product.productSweetnessRating || 0.0 },
    ];

    const ratings2 = [
      { label: "Strength", rating: product.productStrengthRating || 0.0 },
      { label: "Versatility", rating: product.productVersatilityRating || 0.0 },
    ];
    
    const ratingsMap = [
      { max: 0, desc2: "No Rating", style: "text-white dark:bg-gray-500 bg-gray-500" },
      { max: 1, desc2: "Swill", style: "text-white dark:bg-red-500 bg-red-500" },
      { max: 2, desc2: "Forgettable", style: "text-white dark:bg-red-500 bg-red-500" },
      { max: 3, desc2: "Bottom Shelf", style: "text-white dark:bg-red-500 bg-red-500" },
      { max: 4, desc2: "Decent", style: "text-white dark:bg-yellow-500 bg-yellow-500" },
      { max: 5, desc2: "Standard Pour", style: "text-white dark:bg-yellow-500 bg-yellow-500" },
      { max: 6, desc2: "Good Stuff", style: "text-white dark:bg-green-500 bg-green-500" },
      { max: 7, desc2: "Top Shelf", style: "text-white dark:bg-green-500 bg-green-500" },
      { max: 8, desc2: "Connoisseur's Choice", style: "text-white dark:bg-green-500 bg-green-500" },
      { max: 9, desc2: "Bartender's Favorite", style: "text-white dark:bg-blue-500 bg-blue-500" },
    ];

    let vec: number[] | number = ratings.concat(ratings2).map(({ rating }) => rating);
    vec = weightedMean(vec, [6.5, 3.5, 0.95, 11.5])
    const { desc2, style } = ratingsMap.find(({ max }) => vec <= max) || { desc2: "Best in House", style: "text-white dark:bg-violet-500 bg-violet-500" };
    return {
      ratings,
      ratings2,
      desc1: vec.toFixed(1),
      desc2,
      style
    };
  };

  const { ratings, ratings2, desc1, desc2, style } = generateRatings();

  let popoverData = {
    categoryName: '',
    categoryDescription: ''
  }

  const setPopoverData = ({ categoryName, categoryDescription }) => {
    popoverData = { categoryName, categoryDescription }
  }

  const isBaseSpirit = (categoryName: string) => {
    // TODO: this should come from the row 
    // and not hardcoded here like a lazy asshole
    let spirits = [
      'gin', 'whiskey', 'tequila', 'rum', 'vodka', 'brandy', 'cognac', 'mezcal'
    ]

    spirits = spirits.map(item => ` ${item}`);
    return spirits.some(item => categoryName.toLowerCase().includes(item))
  }

</script>

<!-- "grid gap-6 mb-6 md:grid-cols-2 -->
{#if product}
  <div class="space-y-2 text-wrap w-full">
    <!-- desktop only -->
    <div class="hidden sm:py-4 md:py-6 sm:flex sm:flex-auto sm:justify-center grow ">
      <!-- svelte-ignore a11y-missing-attribute -->
      <img class="hidden" src={product.productImageUrl} on:error={imageLoadError}>
      <Card
        img={productImage}
        horizontal
        size="xl"
        class="!w-full shadow-2xl"
        padding="sm"
        imgClass=""
        on:error={imageLoadError}
        >
        <div class="card-content">

          <!-- heading -->
          <div>
            <Heading tag="h5">
               {product.productName}
                <Secondary class="block">
                  <button class="flex items-center" id="popover-image">
                    {product.categoryName}&nbsp;<InfoCircleSolid class="w-5 h-5" />
                  </button>
                </Secondary>
              <!-- tags -->
              <div>
                {#if isBaseSpirit(product.categoryName)}<Badge class="my-1">Base Spirit</Badge>{/if}
                {#if product.productInStockQuantity < 1}<Badge class="my-1" color="red">Out of Stock</Badge>{/if}
                <!-- {#if product.productInStockQuantity < 1}<Badge class="my-1" color="red">{product.productPricePerUnit}</Badge>{/if} -->
              </div>
            </Heading>
          </div>


          <!-- desc -->
          <div class="py-4">
            <p
              class="my-1 font-normal text-gray-700 dark:text-gray-400 leading-tight">
              {product.productDescription || product.categoryDescription}
            </p>
          </div>

          <!-- score -->
          {#if isBaseSpirit(product.categoryName)}
            <div class="py-4">
              <ScoreRating
                desc1Class="w-8 text-sm font-semibold inline-flex items-center p-1.5 rounded {style}"
                linkClass="hidden"
                headerLabel={{ ...headerLabel, desc1, desc2 }}
                {ratings}
                {ratings2} />
            </div>
          {/if}
          <div class="sm:gap-4 sm:items-center sm:flex">
            {#if permissions.includes('edit_inventory')}
              <Button
                color="alternative"
                href="/inventory/{product.productId}/edit">
                <EditOutline />
                <span class="ms-2">Edit</span>
              </Button>
            {/if}
            <!-- <Button color="primary">
              <HeartOutline />
              <span class="ms-2">Add to favorites</span>
            </Button> -->
          </div>
        </div>
      </Card>
    </div>
    <!-- mobile only -->
    <div class="sm:hidden flex justify-center px-2 py-4 md:pb-4 w-full">
      <Card img={product.productImageUrl || placeholder} size="md" padding="sm" class="shadow-2xl">
        <div class="card-content">
          <Heading tag="h5">
             {product.productName}
              <Secondary class="flex items-center">
                <span class="">{product.categoryName}</span>
                <button id="popover-image" on:click|preventDefault={() => setPopoverData(product)}>
                  <InfoCircleSolid class="w-5 h-5 ms-1.5" />
                  <span class="sr-only">Show information</span>
                </button>
              </Secondary>
          </Heading>
          {#if isBaseSpirit(product.categoryName)}<Badge class="my-1">Base Spirit</Badge>{/if}
          {#if product.productInStockQuantity < 1}<Badge class="my-1">Out of Stock</Badge>{/if}
          <p
            class="my-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
            {product.productDescription || product.categoryDescription}
          </p>
          {#if isBaseSpirit(product.categoryName)}
            <hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
            <div class="px-2 md:pb-4">
              <ScoreRating
                desc1Class="w-8 text-sm font-semibold inline-flex items-center p-1.5 rounded {style}"
                linkClass="hidden"
                headerLabel={{ ...headerLabel, desc1, desc2 }}
                {ratings}
                {ratings2} />
            </div>
            <hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />

          {/if}
            <div class="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
              <Button
                color="alternative"
                href="/inventory/{product.productId}/edit">
                <EditOutline />
                <span class="ms-2">Edit</span>
              </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
{:else}
  <ImagePlaceholder />
{/if}

<Popover triggeredBy="#popover-image" class="!w-1/2 !max-w-2/3 text-sm font-light text-gray-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400" placement="top-start" title={product.categoryName}>
  <div class="space-y-2">
    <p>{product.categoryDescription}</p>
    <A aClass="font-medium hover:underline flex items-center py-2" href="/inventory/category/{product.categoryId}/edit">Edit<ArrowRightOutline class="ms-1 h-5 w-5"/>
    </A>
  </div>
</Popover>

<style lang="scss">
  @media (min-width: 768px) {
    .card-content {
      width: 440px;
    }
  }

  @media (min-width: 1024px) {
    .card-content {
      width: 685px;
    }
  }

    @media (min-width: 1280px) {
    .card-content {
      width: 900px;
    }
  }


</style>
