<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: { class?: string; children?: Snippet; [key: string]: unknown } = $props();
</script>

<caption class={cn("mt-4 text-sm text-muted-foreground", className)} {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</caption>
