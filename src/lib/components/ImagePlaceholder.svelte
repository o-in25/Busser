<script lang="ts">
	import { GlassWater, Package } from 'lucide-svelte';

	export let variant: 'recipe' | 'product' = 'recipe';
	let className = '';
	export { className as class };
</script>

<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
	{#if variant === 'recipe'}
		<GlassWater class="text-muted-foreground/40 {className}" />
	{:else}
		<Package class="text-muted-foreground/40 {className}" />
	{/if}
</div>
