<script lang="ts">
  import { cn } from "$lib/utils";

  let {
    class: className,
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    onchange,
    ...restProps
  }: {
    class?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    onchange?: (value: number) => void;
    [key: string]: unknown;
  } = $props();

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = Number(target.value);
    onchange?.(value);
  }

  // Calculate percentage for gradient
  let percentage = $derived(((value - min) / (max - min)) * 100);
</script>

<input
  type="range"
  {min}
  {max}
  {step}
  {disabled}
  {value}
  oninput={handleInput}
  class={cn(
    "slider-input w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all",
    className
  )}
  style="--slider-percentage: {percentage}%"
  {...restProps}
/>

<style>
  .slider-input {
    background: linear-gradient(
      to right,
      hsl(var(--primary)) 0%,
      hsl(var(--primary)) var(--slider-percentage),
      hsl(var(--secondary) / 0.3) var(--slider-percentage),
      hsl(var(--secondary) / 0.3) 100%
    );
  }

  .slider-input::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(340 87% 45%) 100%);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .slider-input::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  }

  .slider-input::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(340 87% 45%) 100%);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .slider-input::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  }
</style>
