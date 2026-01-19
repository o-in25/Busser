<script lang="ts">
  import { cn } from "$lib/utils";
  import { slide } from "svelte/transition";
  import { ChevronDown } from "lucide-svelte";
  import * as Card from "$lib/components/ui/card";
  import type { Snippet } from "svelte";

  let {
    class: className,
    title,
    icon: Icon,
    open = $bindable(true),
    children,
    ...restProps
  }: {
    class?: string;
    title: string;
    icon?: typeof import("lucide-svelte").ChevronDown;
    open?: boolean;
    children?: Snippet;
    [key: string]: unknown;
  } = $props();

  function toggle() {
    open = !open;
  }
</script>

<Card.Root class={cn("overflow-hidden", className)} {...restProps}>
  <button
    type="button"
    class="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
    onclick={toggle}
  >
    <div class="flex items-center gap-2">
      {#if Icon}
        <Icon class="h-5 w-5 text-primary" />
      {/if}
      <span class="font-semibold text-foreground">{title}</span>
    </div>
    <ChevronDown
      class={cn(
        "h-5 w-5 text-muted-foreground transition-transform duration-200",
        open && "rotate-180"
      )}
    />
  </button>

  {#if open}
    <div transition:slide={{ duration: 200 }}>
      <Card.Content class="pt-0 pb-4">
        {#if children}
          {@render children()}
        {/if}
      </Card.Content>
    </div>
  {/if}
</Card.Root>
