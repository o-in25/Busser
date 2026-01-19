<script lang="ts">
  import { cn } from "$lib/utils";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { convertFromMl, getUnits } from "$lib/math";
  import { Check } from "lucide-svelte";

  let {
    class: className,
    stepNumber,
    categoryName,
    productName,
    quantity,
    unit,
    description,
    checked = $bindable(false),
    ontoggle,
    ...restProps
  }: {
    class?: string;
    stepNumber: number;
    categoryName: string;
    productName: string;
    quantity: number;
    unit: string;
    description?: string | null;
    checked?: boolean;
    ontoggle?: (checked: boolean) => void;
    [key: string]: unknown;
  } = $props();

  const units = getUnits();
  const displayQuantity = convertFromMl(unit, quantity);
  const unitLabel = units[unit]?.i18n(quantity) || unit;

  function handleToggle() {
    checked = !checked;
    ontoggle?.(checked);
  }
</script>

<button
  type="button"
  class={cn(
    "w-full flex items-start gap-3 p-4 rounded-lg transition-all duration-200 text-left group",
    checked
      ? "bg-primary/5 border border-primary/20"
      : "bg-card border border-border hover:border-primary/30 hover:bg-accent/30",
    className
  )}
  onclick={handleToggle}
  {...restProps}
>
  <!-- Step number / Check indicator -->
  <div
    class={cn(
      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
      checked
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
    )}
  >
    {#if checked}
      <Check class="w-4 h-4" />
    {:else}
      {stepNumber}
    {/if}
  </div>

  <!-- Content -->
  <div class="flex-1 min-w-0">
    <div class={cn(
      "flex items-baseline gap-2 flex-wrap transition-all",
      checked && "line-through opacity-60"
    )}>
      <span class="font-semibold text-foreground">
        {displayQuantity} {unitLabel}
      </span>
      <span class="text-muted-foreground">of</span>
      <span class="font-medium text-foreground">{categoryName}</span>
    </div>
    {#if productName && productName !== categoryName}
      <p class={cn(
        "text-sm text-muted-foreground mt-0.5",
        checked && "line-through opacity-60"
      )}>
        {productName}
      </p>
    {/if}
    {#if description}
      <p class={cn(
        "text-xs text-muted-foreground/70 mt-1 italic",
        checked && "line-through opacity-60"
      )}>
        {description}
      </p>
    {/if}
  </div>
</button>
