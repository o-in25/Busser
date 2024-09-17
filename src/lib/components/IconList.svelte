<script lang="ts">
  import { Heading, List, Li } from "flowbite-svelte";
  import { CheckCircleSolid, CloseCircleSolid } from "flowbite-svelte-icons";
  export let type: "success" | "error";
  export let heading: string;
  export let list: string[];
  export let maxItems: number = 3;

  console.log(list)
  $: list = list.slice(0, 3)
</script>

<Heading
  tag="h6"
  customSize="text-md font-semibold"
  class="text-md font-semibold text-gray-900 dark:text-white">
  {heading}
</Heading>
<List tag="ul" class="space-y-1 text-gray-500 dark:text-gray-400" list="none">
  {#each list as item}
    <Li icon>
      {#if type === "success"}
        <CheckCircleSolid
          class="w-5 h-5 me-2 text-green-500 dark:text-green-400" />
      {:else if type === "error"}
        <CloseCircleSolid class="w-5 h-5 me-2 text-red-500 dark:text-red-400" />
      {/if}
      {item}
    </Li>
  {/each}

</List>