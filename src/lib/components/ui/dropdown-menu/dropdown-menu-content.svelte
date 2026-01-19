<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";

  let {
    class: className,
    sideOffset = 4,
    children,
    ...restProps
  }: DropdownMenuPrimitive.ContentProps = $props();
</script>

<DropdownMenuPrimitive.Portal>
  <DropdownMenuPrimitive.Content
    {sideOffset}
    class={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-white/30 dark:border-zinc-700/40 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-1 text-popover-foreground shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...restProps}
  >
    {#if children}
      {@render children()}
    {/if}
  </DropdownMenuPrimitive.Content>
</DropdownMenuPrimitive.Portal>
