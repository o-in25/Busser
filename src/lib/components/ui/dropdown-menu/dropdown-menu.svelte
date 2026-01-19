<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

  let {
    open = $bindable(false),
    onOpenChange,
    children,
    ...restProps
  }: DropdownMenuPrimitive.RootProps = $props();
</script>

<DropdownMenuPrimitive.Root bind:open {onOpenChange} {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</DropdownMenuPrimitive.Root>
