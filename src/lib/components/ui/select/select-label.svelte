<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: SelectPrimitive.GroupHeadingProps & { class?: string; children?: Snippet } = $props();
</script>

<SelectPrimitive.GroupHeading
  class={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</SelectPrimitive.GroupHeading>
