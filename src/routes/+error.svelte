<script lang="ts">
    import { page } from '$app/stores';
    import { Heading, P, A } from 'flowbite-svelte';
    import { ChevronRightOutline } from 'flowbite-svelte-icons';
</script>

<Heading tag="h2" customSize="text-4xl font-extrabold ">{$page.error?.reason}</Heading>
{#if $page.error?.message}
  <P class="my-4 mt-1 text-gray-500">{$page.error.message}</P>
{/if}
