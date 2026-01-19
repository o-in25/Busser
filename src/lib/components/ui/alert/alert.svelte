<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  type Variant = "default" | "destructive" | "success" | "warning";

  let {
    class: className,
    variant = "default",
    children,
    ...restProps
  }: HTMLAttributes<HTMLDivElement> & { variant?: Variant; children?: Snippet } = $props();

  const variantClasses: Record<Variant, string> = {
    default: "bg-white/50 dark:bg-zinc-900/50 border-white/30 dark:border-zinc-700/40 text-foreground",
    destructive: "bg-destructive/10 dark:bg-destructive/20 border-destructive/30 dark:border-destructive/40 text-destructive dark:text-red-400 [&>svg]:text-destructive dark:[&>svg]:text-red-400",
    success: "bg-green-500/10 dark:bg-green-500/20 border-green-500/30 dark:border-green-500/40 text-green-700 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400",
    warning: "bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30 dark:border-yellow-500/40 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400",
  };
</script>

<div
  role="alert"
  class={cn(
    "relative w-full rounded-xl border p-4 backdrop-blur-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
    variantClasses[variant],
    className
  )}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</div>
