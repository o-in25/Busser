<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLParagraphElement> & { children?: Snippet } = $props();
</script>

<div class={cn("text-sm [&_p]:leading-relaxed", className)} {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</div>
