<script lang="ts">
    import ThemeMixer from "$lib/components/ThemeMixer.svelte";
  import { Label, Heading } from "flowbite-svelte";
  import { DarkMode } from "flowbite-svelte";
</script>
<svelte:head>
    <title>Settings - Busser</title> 
</svelte:head>
<div class="text-sm text-gray-500 dark:text-gray-400">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between font-extrabold">
      General
  </Heading>
</div>
<div class="flex justify-left items-center">
  <ThemeMixer></ThemeMixer>
</div>