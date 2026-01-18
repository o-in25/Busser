<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import { Check } from "lucide-svelte";
  import type { Snippet } from "svelte";

  let {
    class: className,
    value,
    label,
    disabled = false,
    children,
    ...restProps
  }: SelectPrimitive.ItemProps & { class?: string; label?: string; children?: Snippet } = $props();
</script>

<SelectPrimitive.Item
  {value}
  {disabled}
  class={cn(
    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent/80 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[selected]:bg-accent data-[selected]:text-accent-foreground transition-colors",
    className
  )}
  {...restProps}
>
  {#snippet children({ selected })}
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {#if selected}
        <Check class="h-4 w-4" />
      {/if}
    </span>
    {label ?? value}
  {/snippet}
</SelectPrimitive.Item>
