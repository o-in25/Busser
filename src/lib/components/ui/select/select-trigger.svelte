<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import { ChevronDown } from "lucide-svelte";

  let {
    class: className,
    children,
    ...restProps
  }: SelectPrimitive.TriggerProps = $props();
</script>

<SelectPrimitive.Trigger
  class={cn(
    "flex h-10 w-full items-center justify-between rounded-lg border border-input/50 bg-white/50 dark:bg-zinc-800/40 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:bg-white/70 dark:focus:bg-zinc-800/60 focus:border-primary/50 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    className
  )}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
  <ChevronDown class="h-4 w-4 opacity-50" />
</SelectPrimitive.Trigger>
