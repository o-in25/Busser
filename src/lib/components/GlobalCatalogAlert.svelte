<script lang="ts">
	import { Globe } from 'lucide-svelte';
	import Callout from '$lib/components/Callout.svelte';

	let { class: className }: { class?: string } = $props();
</script>

<Callout class={className}>
	{#snippet icon()}<Globe class="h-5 w-5 text-primary" />{/snippet}
	{#snippet children()}
		<p class="sm:hidden">Viewing global catalog</p>
		<p class="hidden sm:block">
			You're viewing <strong>Busser's global catalog</strong>. Use the Workspace switcher to switch
			to your own and manage your inventory.
		</p>
	{/snippet}
</Callout>
