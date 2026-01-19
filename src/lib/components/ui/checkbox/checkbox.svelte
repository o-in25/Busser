<script lang="ts">
  import { cn } from "$lib/utils";
  import { Check } from "lucide-svelte";

  let {
    class: className,
    checked = $bindable(false),
    disabled = false,
    onchange,
    ...restProps
  }: {
    class?: string;
    checked?: boolean;
    disabled?: boolean;
    onchange?: (checked: boolean) => void;
    [key: string]: unknown;
  } = $props();

  function toggle() {
    if (disabled) return;
    checked = !checked;
    onchange?.(checked);
  }
</script>

<button
  type="button"
  role="checkbox"
  aria-checked={checked}
  {disabled}
  class={cn(
    "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    checked ? "bg-primary text-primary-foreground" : "bg-background",
    className
  )}
  onclick={toggle}
  {...restProps}
>
  {#if checked}
    <Check class="h-4 w-4" />
  {/if}
</button>
