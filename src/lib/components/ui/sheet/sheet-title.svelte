<script lang="ts">
  import { Dialog as SheetPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";

  let {
    class: className,
    children,
    ...restProps
  }: SheetPrimitive.TitleProps = $props();
</script>

<SheetPrimitive.Title
  class={cn("text-lg font-semibold text-foreground", className)}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</SheetPrimitive.Title>
