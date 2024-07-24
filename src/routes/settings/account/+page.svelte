<script lang="ts">
    import type { PageData } from './$types';
    import { GradientButton, Heading, Span } from 'flowbite-svelte';
    import { goto, invalidateAll } from '$app/navigation';
    import { ArrowRightToBracketOutline } from 'flowbite-svelte-icons';
    
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
  <Heading tag="h4" class="mb-4 flex flex-row justify-between">
      Account
  </Heading>
</div>
<div class="flex justify-left items-center">
  <GradientButton color="green" href="/inventory/add" size="lg" on:click={logout}>
      <ArrowRightToBracketOutline/>
      <Span class="pl-1">Log Out</Span>
  </GradientButton>
</div>