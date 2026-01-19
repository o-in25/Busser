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

<tbody class={cn("[&_tr:last-child]:border-0", className)} {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</tbody>
