<script lang="ts">
  import { Tabs as TabsPrimitive } from "bits-ui";

  let {
    value = $bindable(),
    onValueChange,
    children,
    ...restProps
  }: TabsPrimitive.RootProps = $props();
</script>

<TabsPrimitive.Root bind:value {onValueChange} {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</TabsPrimitive.Root>
