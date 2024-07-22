<script lang="ts">
  import type { Product } from "$lib/types";
  import {
    ImagePlaceholder,
    P,
    Heading,
    ButtonGroup,
    GradientButton,
    ScoreRating,
    Badge,
    Progressbar,
    Card,
    Button,
    Secondary,
  } from "flowbite-svelte";
  import {
    ArrowRightOutline,
    EditOutline,
    TrashBinOutline,
  } from "flowbite-svelte-icons";
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

  const fakeRatings = () => {
    let vec: number[] = [];
    for (let i = 0; i < 4; i++) {
      const randomRating = Math.floor(Math.random() * (1000 - 100) + 100) / 100;
      vec.push(randomRating);
    }
    let ratings = [
      { label: "Taste", rating: vec[0] },
      { label: "Smoothness", rating: vec[1] },
    ];

    let ratings2 = [
      { label: "Cost", rating: vec[2] },
      { label: "Versatility", rating: vec[3] },
    ];

    let avg =
      Math.round((vec.reduce((acc, curr) => acc + curr, 0) / vec.length) * 10) /
      10;
    if (avg <= 1) {
      //'dark:bg-red-500 bg-red-500'
      return {
        ratings,
        ratings2,
        desc1: avg.toFixed(1),
        desc2: "Swill",
        style: "text-white dark:bg-red-500 bg-red-500",
      };
    }
    if (avg <= 2) {
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

  const { ratings, ratings2, desc1, desc2, style } = fakeRatings();
</script>

<!-- "grid gap-6 mb-6 md:grid-cols-2 -->
{#if product}
  <div class="space-y-2 text-wrap w-full">
    <!-- desktop only -->
    <div class="hidden sm:flex sm:flex-auto sm:justify-center grow">
      <Card
        img={product.productImageUrl}
        horizontal
        size="xl"
        class="!w-full"
        padding="xl">
        <div class="card-content">
          <Heading tag="h5">
            <span class="block w-96">{product.productName}</span>
          </Heading>
          <p
            class="my-1 font-normal text-gray-700 dark:text-gray-400 leading-tight">
            {product.categoryDescription}
          </p>
          <div class="py-4">
            <ScoreRating
              desc1Class="w-8 text-sm font-semibold inline-flex items-center p-1.5 rounded {style}"
              linkClass="hidden"
              headerLabel={{ ...headerLabel, desc1, desc2 }}
              {ratings}
              {ratings2} />
          </div>

          <div class="w-40">
            <GradientButton outline color="purpleToBlue" size="md">
              <EditOutline class="mr-1" />Edit
            </GradientButton>
          </div>
        </div>
      </Card>
    </div>
    <!-- mobile only -->
    <div class="sm:hidden flex justify-center px-2 pt-4 md:pb-4 w-full">
      <Card img={product.productImageUrl} size="md" href={null} padding="sm">
        <div class="card-content">
          <Heading tag="h5">
            <span class="block">{product.productName}</span>
            <Secondary class="mt-0">{product.categoryName}</Secondary>
          </Heading>
          <p
            class="my-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
            {product.categoryDescription}
          </p>
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
          <GradientButton
            outline
            color="purpleToBlue"
            size="lg"
            class="w-full my-4">
            <EditOutline class="mr-1" />Edit
          </GradientButton>
        </div>
      </Card>
    </div>
  </div>
{:else}
  <!-- <ImagePlaceholder /> -->
{/if}

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
</style>
