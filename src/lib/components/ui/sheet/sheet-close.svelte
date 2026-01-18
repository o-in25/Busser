<script lang="ts">
  import { Dialog as SheetPrimitive } from "bits-ui";

  let { children, ...restProps }: SheetPrimitive.CloseProps = $props();
</script>

<SheetPrimitive.Close {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</SheetPrimitive.Close>
