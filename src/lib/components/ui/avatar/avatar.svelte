<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLSpanElement> & { children?: Snippet } = $props();
</script>

<span
  class={cn(
    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
    className
  )}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</span>
