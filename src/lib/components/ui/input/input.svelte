<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLInputAttributes } from "svelte/elements";

  let {
    class: className,
    value = $bindable(),
    ...restProps
  }: HTMLInputAttributes & { value?: string } = $props();
</script>

<input
  class={cn(
    "flex h-10 w-full rounded-lg border border-input/50 bg-white/80 dark:bg-zinc-800/60 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:bg-white dark:focus:bg-zinc-800/80 focus:border-primary/50 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  bind:value
  {...restProps}
/>
