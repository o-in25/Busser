<script lang="ts">
  import { Dialog as SheetPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import { X } from "lucide-svelte";
  import SheetOverlay from "./sheet-overlay.svelte";

  type Side = "top" | "bottom" | "left" | "right";

  let {
    class: className,
    side = "right",
    children,
    ...restProps
  }: SheetPrimitive.ContentProps & { side?: Side } = $props();

  const sideClasses: Record<Side, string> = {
    top: "inset-x-0 top-0 border-b data-[state=closed]:animate-slide-out-to-top data-[state=open]:animate-slide-in-from-top",
    bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:animate-slide-out-to-bottom data-[state=open]:animate-slide-in-from-bottom",
    left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:animate-slide-out-to-left data-[state=open]:animate-slide-in-from-left sm:max-w-sm",
    right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:animate-slide-out-to-right data-[state=open]:animate-slide-in-from-right sm:max-w-sm",
  };
</script>

<SheetPrimitive.Portal>
  <SheetOverlay />
  <SheetPrimitive.Content
    class={cn(
      "fixed z-50 gap-4 bg-white/90 dark:bg-zinc-900/85 backdrop-blur-2xl p-6 shadow-2xl",
      sideClasses[side],
      className
    )}
    {...restProps}
  >
    {#if children}
      {@render children()}
    {/if}
    <SheetPrimitive.Close
      class="absolute right-4 top-4 rounded-full p-1 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
    >
      <X class="h-4 w-4" />
      <span class="sr-only">Close</span>
    </SheetPrimitive.Close>
  </SheetPrimitive.Content>
</SheetPrimitive.Portal>
