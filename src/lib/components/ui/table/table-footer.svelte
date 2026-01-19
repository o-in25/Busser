<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLTableSectionElement> & { children?: Snippet } = $props();
</script>

<tfoot
  class={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</tfoot>
