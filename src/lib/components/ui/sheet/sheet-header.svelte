<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLDivElement> & { children?: Snippet } = $props();
</script>

<div
  class={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</div>
