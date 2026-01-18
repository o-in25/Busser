<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    class: className,
    ...restProps
  }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn("animate-pulse rounded-md bg-muted", className)}
  {...restProps}
></div>
