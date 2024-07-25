<script lang="ts">
    import { createEventDispatcher } from "svelte";

  export let href: string = "";
  export let style = "";
  export let spacing = '';
  export let type: "button" | "submit" | "reset" | null | undefined = "button";
  export let color: 'purpleToBlue' | 'orangeToRed' = 'purpleToBlue';

  const dispatch = createEventDispatcher();

  const colors = {
    purpleToBlue: 'p-1 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-blue-300 dark:focus:ring-blue-800 rounded-lg',
    orangeToRed:  'p-1 text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl focus:ring-pink-200 dark:focus:ring-pink-800 rounded-lg'
  }

  const onClick = ({ target }) => dispatch('clicked', target)

</script>
<div
  class="{colors[color]} {style}">
  {#if href}
    <a
      {href}
      class="text-center font-medium focus-within:ring-4 focus-within:outline-none text-base inline-flex items-center justify-center w-full !border-0 !rounded-md bg-white !text-gray-800 dark:bg-gray-800 dark:!text-white hover:bg-transparent hover:!text-inherit transition-all duration-75 ease-in group-hover:!bg-opacity-0 group-hover:!text-inherit {spacing || 'px-4 py-2'}"
      role="button"
    >
      <slot />
    </a>
  {:else}
    <button
      {type}
      class="text-center font-medium focus-within:ring-4 focus-within:outline-none text-base inline-flex items-center justify-center w-full !border-0 !rounded-md bg-white !text-gray-800 dark:bg-gray-800 dark:!text-white hover:bg-transparent hover:!text-inherit transition-all duration-75 ease-in group-hover:!bg-opacity-0 group-hover:!text-inherit {spacing || 'px-4 py-2'}"
      on:click={onClick}
    >
      <slot />
    </button>

  {/if}
</div>
