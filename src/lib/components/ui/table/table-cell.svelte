<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTdAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLTdAttributes & { children?: Snippet } = $props();
</script>

<td
  class={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</td>
