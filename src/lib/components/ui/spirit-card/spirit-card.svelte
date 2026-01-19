<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Spirit } from "$lib/types";

  let {
    class: className,
    spirit,
    selected = false,
    name = "recipeCategoryId",
    onselect,
    ...restProps
  }: {
    class?: string;
    spirit: Spirit;
    selected?: boolean;
    name?: string;
    onselect?: (spirit: Spirit) => void;
    [key: string]: unknown;
  } = $props();

  function handleClick() {
    onselect?.(spirit);
  }
</script>

<label class={cn("cursor-pointer", className)} {...restProps}>
  <input
    type="radio"
    {name}
    value={spirit.recipeCategoryId}
    checked={selected}
    onchange={handleClick}
    class="sr-only peer"
  />
  <div
    class={cn(
      "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200",
      "bg-card hover:bg-accent/50",
      selected
        ? "border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/10"
        : "border-input hover:border-primary/50"
    )}
  >
    <!-- Image container with glow effect on selection -->
    <div
      class={cn(
        "relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-transform duration-200",
        "hover:scale-105",
        selected && "scale-105"
      )}
    >
      {#if selected}
        <div class="absolute inset-0 bg-primary/10 animate-pulse rounded-lg"></div>
      {/if}
      <img
        src={spirit.recipeCategoryDescriptionImageUrl}
        alt={spirit.recipeCategoryDescription}
        class="w-full h-full object-contain relative z-10"
      />
    </div>

    <!-- Label -->
    <span
      class={cn(
        "mt-2 text-sm font-medium text-center truncate w-full transition-colors",
        selected ? "text-primary" : "text-muted-foreground"
      )}
    >
      {spirit.recipeCategoryDescription}
    </span>

    <!-- Selected indicator dot -->
    {#if selected}
      <div class="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
        <svg class="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </div>
    {/if}
  </div>
</label>
