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
  } from "flowbite-svelte";
  import {
    ArrowRightOutline,
    InfoCircleSolid,
  } from "flowbite-svelte-icons";
  import FancyButton from "./FancyButton.svelte";
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

  // fallback if image cant load 
  let productImage = product?.productImageUrl || placeholder;
  const imageLoadError = () => productImage = placeholder

  const weightedMean = (arrValues: number[], arrWeights: number[]) => {
    const result = arrValues
      .map((value, i) => {
        const weight = arrWeights[i]
        const sum = value * weight
        return [sum, weight]
      })
      .reduce((p, c) => [p[0] + c[0], p[1] + c[1]], [0, 0])

    return result[0] / result[1]
  }

  const generateRatings = () => {
    let ratings = [
      { label: "Dryness", rating: product.productDrynessRating || 0.0 },
      { label: "Sweetness", rating: product.productSweetnessRating || 0.0 },
    ];

    let ratings2 = [
      { label: "Strength", rating: product.productStrengthRating || 0.0 },
      { label: "Versatility", rating: product.productVersatilityRating || 0.0 },
    ];
    let vec: number[] = ratings.concat(ratings2).map(({ rating }) => rating);

    // let avg =
    //   Math.round((vec.reduce((acc, curr) => acc + curr, 0) / vec.length) * 10) /
    //   10;
    let avg = weightedMean(vec, [6.5, 3.5, 0.95, 11.5])
    if(avg === 0) {
      return {
        ratings,
        ratings2,
        desc1: Number(0).toFixed(1),
        desc2: "No Rating",
        style: "text-white dark:bg-gray-500 bg-gray-500",
      };
    }
    if(avg <= 1) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Swill",
        style: "text-white dark:bg-red-500 bg-red-500",
      };
    }
    if(avg <= 2) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Forgettable",
        style: "text-white dark:bg-red-500 bg-red-500",
      };
    }

    if (avg <= 3) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Bottom Shelf",
        style: "text-white dark:bg-red-500 bg-red-500",
      };
    }

    if (avg <= 4) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Decent",
        style: "text-white dark:bg-yellow-500 bg-yellow-500",
      };
    }

    if (avg <= 5) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Standard Pour",
        style: "text-white dark:bg-yellow-500 bg-yellow-500",
      };
    }

    if (avg <= 6) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Good Stuff",
        style: "text-white dark:bg-green-500 bg-green-500",
      };
    }

    if (avg <= 7) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Top Shelf",
        style: "text-white dark:bg-green-500 bg-green-500",
      };
    }

    if (avg <= 8) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Connoisseur's Choice",
        style: "text-white dark:bg-green-500 bg-green-500",
      };
    }

    if (avg <= 9) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Bartender's Favorite",
        style: "text-white dark:bg-blue-500 bg-blue-500",
      };
    }

    return {
      ratings,
      ratings2,
      desc1: avg.toFixed(1),
      desc2: "Best in House",
      style: "text-white dark:bg-violet-500 bg-violet-500",
    };
  };

  const parseSize = (ml: number) => {
    if (ml === 0) return "N/A";
    if (ml < 1000) return `${ml} ML`;
    return `${ml / 1000} L`;
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
        padding="xl"
        on:error={imageLoadError}
        >
        <div class="card-content">
          <Heading tag="h5">
             {product.productName}
             {#if product.productName !== product.categoryName}
              <Secondary class="block">
                <button class="flex items-center" id="popover-image" on:click={() => setPopoverData(product)}>
                  {product.categoryName}&nbsp;<InfoCircleSolid class="w-5 h-5" />
                </button>
              </Secondary>
            {/if}
          </Heading>
          {#if isBaseSpirit(product.categoryName)}
            <Badge class="my-1">Base Spirit</Badge>
          {/if}
          <p
            class="my-1 font-normal text-gray-700 dark:text-gray-400 leading-tight">
            {product.productDescription || product.categoryDescription}
          </p>
          {#if product.productProof > 0}
            <div class="py-4">
              <ScoreRating
                desc1Class="w-8 text-sm font-semibold inline-flex items-center p-1.5 rounded {style}"
                linkClass="hidden"
                headerLabel={{ ...headerLabel, desc1, desc2 }}
                {ratings}
                {ratings2} />
            </div>
          {/if}

          <div class="w-40 mt-4">
            <FancyButton href="/inventory/{product.productId}/edit">
              Edit
            </FancyButton>
          </div>
        </div>
      </Card>
    </div>
    <!-- mobile only -->
    <div class="sm:hidden flex justify-center px-2 py-4 md:pb-4 w-full">
      <Card img={product.productImageUrl || placeholder} size="md" href={null} padding="sm" class="shadow-2xl">
        <div class="card-content">
          <Heading tag="h5">
             {product.productName}
             {#if product.productName !== product.categoryName}
              <Secondary class="block">
                <button class="flex items-center" id="popover-image" on:click={() => setPopoverData(product)}>
                  {product.categoryName}&nbsp;<InfoCircleSolid class="w-5 h-5" />
                </button>
              </Secondary>
            {/if}
          </Heading>
          {#if isBaseSpirit(product.categoryName)}
            <Badge class="my-1">Base Spirit</Badge>
          {/if}
          <p
            class="my-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
            {product.productDescription || product.categoryDescription}
          </p>
          {#if product.productProof > 0}
            <hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
            <div class="px-2 md:pb-4">
              <ScoreRating
                desc1Class="w-8 text-sm font-semibold inline-flex items-center p-1.5 rounded {style}"
                linkClass="hidden"
                headerLabel={{ ...headerLabel, desc1, desc2 }}
                {ratings}
                {ratings2} />
            </div>
          {/if}
          <hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
          <div class="gost">
            <FancyButton href="/inventory/{product.productId}/edit">Edit</FancyButton>
          </div>
        </div>
      </Card>
    </div>
  </div>
{:else}
  <ImagePlaceholder />
{/if}

<Popover triggeredBy="#popover-image" class="w-96 text-sm font-light" defaultClass="">
  <div class="space-y-2 p-3">
    <h3 class="font-semibold text-gray-900 dark:text-white">
      {popoverData.categoryName}
      <h3>
        {popoverData.categoryDescription}
        <!-- <p class="text-gray-500 dark:text-gray-500">Italy is located in the middle of the Mediterranean Sea, in Southern Europe it is also considered part of Western Europe. A unitary parliamentary republic with Rome as its capital and largest city.</p>
        <a href="/" class="flex items-center font-medium text-primary-600 dark:text-primary-500 dark:hover:text-primary-600 hover:text-primary-700">
          Read more <ChevronRightOutline class="w-2 h-2 ms-1.5 text-primary-600 dark:text-primary-500" />
        </a> -->
      </h3>
      <A aClass="font-medium hover:underline flex items-center py-2">Edit<ArrowRightOutline class="ms-1 h-5 w-5"/>
      </A>
    </h3>
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
