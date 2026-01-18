<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLImgAttributes } from "svelte/elements";

  let {
    class: className,
    ...restProps
  }: HTMLImgAttributes = $props();
</script>

<img
  class={cn("aspect-square h-full w-full", className)}
  {...restProps}
/>
