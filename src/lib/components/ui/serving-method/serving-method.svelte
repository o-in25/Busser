<script lang="ts">
  import { cn } from "$lib/utils";
  import { Badge } from "$lib/components/ui/badge";
  import type { PreparationMethod } from "$lib/types";
  import { GlassWater, Martini, Wind, Sparkles } from "lucide-svelte";

  let {
    class: className,
    methods,
    value = $bindable<number>(),
    name = "recipeTechniqueDescriptionId",
    onchange,
    ...restProps
  }: {
    class?: string;
    methods: PreparationMethod[];
    value?: number;
    name?: string;
    onchange?: (method: PreparationMethod) => void;
    [key: string]: unknown;
  } = $props();

  // Icon mapping for preparation methods
  const iconMap: Record<string, typeof Martini> = {
    "Stirred": Martini,
    "Shaken": GlassWater,
    "Built": Wind,
    "Blended": Sparkles,
  };

  let selectedMethod = $derived(methods.find(m => m.recipeTechniqueDescriptionId === value));

  function handleSelect(method: PreparationMethod) {
    value = method.recipeTechniqueDescriptionId;
    onchange?.(method);
  }
</script>

<div class={cn("space-y-2", className)} {...restProps}>
  <input type="hidden" {name} value={value} />

  <div class="flex rounded-lg border border-input bg-card p-1 gap-1">
    {#each methods as method, i}
      {@const isSelected = method.recipeTechniqueDescriptionId === value}
      {@const MethodIcon = iconMap[method.recipeTechniqueDescriptionText] || Martini}

      <button
        type="button"
        class={cn(
          "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200",
          isSelected
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        onclick={() => handleSelect(method)}
      >
        <MethodIcon class="h-4 w-4" />
        <span class="hidden sm:inline">{method.recipeTechniqueDescriptionText}</span>
        <span class="sm:hidden">{method.recipeTechniqueDescriptionText.slice(0, 4)}</span>
      </button>
    {/each}
  </div>

  <!-- Dilution info badge -->
  {#if selectedMethod}
    <div class="flex items-center justify-center gap-2">
      <Badge variant="secondary" class="text-xs font-normal">
        <span class="text-muted-foreground">Dilution:</span>
        <span class="ml-1 font-medium">{selectedMethod.recipeTechniqueDilutionPercentage}%</span>
      </Badge>
    </div>
  {/if}
</div>
