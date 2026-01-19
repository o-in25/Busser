<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    class: className,
    orientation = "horizontal",
    decorative = true,
    ...restProps
  }: HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
    decorative?: boolean;
  } = $props();
</script>

<div
  role={decorative ? "none" : "separator"}
  aria-orientation={decorative ? undefined : orientation}
  class={cn(
    "shrink-0 bg-border",
    orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
    className
  )}
  {...restProps}
></div>
