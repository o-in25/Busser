<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLTableRowElement> & { children?: Snippet } = $props();
</script>

<tr
  class={cn(
    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
    className
  )}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</tr>
