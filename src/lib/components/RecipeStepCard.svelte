<script lang="ts">
  import { cn } from "$lib/utils";
  import * as Card from "$lib/components/ui/card";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Input } from "$lib/components/ui/input";
  import { QuickSelect } from "$lib/components/ui/quick-select";
  import Autocomplete from "./Autocomplete.svelte";
  import { GripVertical, X } from "lucide-svelte";
  import type { View } from "$lib/types";

  let {
    class: className,
    step = $bindable<View.BasicRecipeStep>(),
    stepNumber,
    onremove,
    canRemove = true,
    ...restProps
  }: {
    class?: string;
    step: View.BasicRecipeStep;
    stepNumber: number;
    onremove?: (stepNumber: number) => void;
    canRemove?: boolean;
    [key: string]: unknown;
  } = $props();

  // Convert productId to/from string for Autocomplete
  let productIdValue: string | null = $state(step.productId ? String(step.productId) : null);

  $effect(() => {
    step.productId = productIdValue ? parseInt(productIdValue, 10) : 0;
  });

  // Quick select options for quantities
  const ozQuickOptions = [
    { label: "0.25oz", value: "0.25:oz" },
    { label: "0.5oz", value: "0.5:oz" },
    { label: "0.75oz", value: "0.75:oz" },
    { label: "1oz", value: "1:oz" },
    { label: "1.5oz", value: "1.5:oz" },
    { label: "2oz", value: "2:oz" },
  ];

  const dashQuickOptions = [
    { label: "1 dash", value: "1:dash" },
    { label: "2 dash", value: "2:dash" },
    { label: "3 dash", value: "3:dash" },
  ];

  function handleQuickSelect(val: string | number) {
    const [qty, unit] = String(val).split(":");
    step.productIdQuantityInMilliliters = parseFloat(qty);
    step.productIdQuantityUnit = unit;
  }

  let descriptionLength = $derived(step.recipeStepDescription?.length || 0);
  const maxDescription = 200;
</script>

<Card.Root class={cn("relative group", className)} {...restProps}>
  <!-- Drag handle visual (decorative) -->
  <div class="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity cursor-grab">
    <GripVertical class="h-5 w-5 text-muted-foreground" />
  </div>

  <Card.Header class="pb-3">
    <div class="flex items-center justify-between">
      <Card.Title class="flex items-center gap-2 text-base">
        <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold">
          {stepNumber + 1}
        </span>
        Ingredient
      </Card.Title>

      <!-- Remove button -->
      {#if canRemove}
        <button
          type="button"
          class="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
          onclick={() => onremove?.(stepNumber)}
        >
          <X class="w-4 h-4" />
        </button>
      {/if}
    </div>
  </Card.Header>

  <Card.Content class="space-y-4">
    <!-- Product name autocomplete -->
    <div>
      <Autocomplete
        label="Item from Inventory"
        placeholder="Search for an ingredient..."
        name="productId"
        fetchUrl="/api/select/products"
        bind:value={productIdValue}
        key={step.productName}
      />
    </div>

    <!-- Amount section -->
    <div class="space-y-2">
      <Label class="text-sm">Amount</Label>

      <!-- Quantity + Unit inputs -->
      <div class="flex gap-2">
        <Input
          name="productIdQuantityInMilliliters"
          type="number"
          class="flex-1"
          placeholder="0"
          value={String(step.productIdQuantityInMilliliters)}
          oninput={(e) => step.productIdQuantityInMilliliters = parseFloat(e.currentTarget.value) || 0}
          step="0.25"
          min="0"
        />
        <select
          name="productIdQuantityUnit"
          class="w-24 py-2.5 px-3 text-sm font-medium bg-muted border border-input rounded-md hover:bg-accent focus:ring-2 focus:outline-none focus:ring-ring"
          bind:value={step.productIdQuantityUnit}
        >
          {#each ["oz", "ml", "dash", "cube"] as unit}
            <option value={unit}>{unit}</option>
          {/each}
        </select>
      </div>

      <!-- Quick select for oz amounts -->
      <QuickSelect
        options={ozQuickOptions}
        onselect={handleQuickSelect}
        class="mt-2"
      />

      <!-- Quick select for dashes -->
      <QuickSelect
        options={dashQuickOptions}
        onselect={handleQuickSelect}
      />
    </div>

    <!-- Description -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <Label for={`step-desc-${stepNumber}`} class="text-sm">Notes</Label>
        <span class={cn(
          "text-xs",
          descriptionLength > maxDescription ? "text-destructive" : "text-muted-foreground"
        )}>
          {descriptionLength}/{maxDescription}
        </span>
      </div>
      <Textarea
        id={`step-desc-${stepNumber}`}
        rows={2}
        placeholder="Optional notes about this ingredient..."
        bind:value={step.recipeStepDescription}
        class="resize-none"
      />
    </div>
  </Card.Content>
</Card.Root>
