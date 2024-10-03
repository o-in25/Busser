<script lang="ts">
    import type { PageData } from './$types';
    import { GradientButton, Heading, Span } from 'flowbite-svelte';
    import { goto, invalidateAll } from '$app/navigation';
    import { ArrowRightToBracketOutline } from 'flowbite-svelte-icons';
    import FancyButton from '$lib/components/FancyButton.svelte';
    
    export let data: PageData;

    async function logout() {
      const response = await fetch("/logout", {
        method: "POST",
      });
      if (response.ok) {
        await invalidateAll();
        await goto(`/`);
      }
  } 
</script>

<div class="text-sm text-gray-500 dark:text-gray-400">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between font-extrabold">
      Account
  </Heading>
</div>
<div class="flex justify-left items-center">
  <FancyButton on:clicked={logout}>Log Out</FancyButton>
</div>