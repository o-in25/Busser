<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTextareaAttributes } from "svelte/elements";

  let {
    class: className,
    value = $bindable(),
    ...restProps
  }: HTMLTextareaAttributes & { value?: string } = $props();
</script>

<textarea
  class={cn(
    "flex min-h-[80px] w-full rounded-lg border border-input/50 bg-white/50 dark:bg-zinc-800/40 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:bg-white/70 dark:focus:bg-zinc-800/60 focus:border-primary/50 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
    className
  )}
  bind:value
  {...restProps}
></textarea>
