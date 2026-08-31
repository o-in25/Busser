<script lang="ts">
	import { Globe } from 'lucide-svelte';
	import FancyAlert from '$lib/components/FancyAlert.svelte';

	let { class: className }: { class?: string } = $props();
</script>

<FancyAlert class={className}>
	{#snippet icon()}<Globe class="h-5 w-5 text-primary" />{/snippet}
	{#snippet children()}
		<p class="sm:hidden">Viewing global catalog</p>
		<p class="hidden sm:block">
			You're viewing <strong>Busser's global catalog</strong>. Use the workspace switcher to switch
			to your own and manage your inventory.
		</p>
	{/snippet}
</FancyAlert>
