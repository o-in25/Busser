<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLHeadingElement> & { children?: Snippet } = $props();
</script>

<h5
  class={cn("mb-1 font-medium leading-none tracking-tight", className)}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</h5>
