<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";

  let { children, ...restProps }: DialogPrimitive.TriggerProps = $props();
</script>

<DialogPrimitive.Trigger {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</DialogPrimitive.Trigger>
