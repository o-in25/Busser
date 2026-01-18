<script lang="ts">
  import { Popover as PopoverPrimitive } from "bits-ui";

  let {
    children,
    ...restProps
  }: PopoverPrimitive.RootProps = $props();
</script>

<PopoverPrimitive.Root {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</PopoverPrimitive.Root>
