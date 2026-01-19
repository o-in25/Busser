<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTableAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLTableAttributes & { children?: Snippet } = $props();
</script>

<div class="relative w-full overflow-auto">
  <table class={cn("w-full caption-bottom text-sm", className)} {...restProps}>
    {#if children}
      {@render children()}
    {/if}
  </table>
</div>
