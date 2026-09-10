<script lang="ts">
	import { Check } from 'lucide-svelte';
	import { onDestroy } from 'svelte';

	import { browser } from '$app/environment';

	let { lastSaved = null }: { lastSaved?: Date | null } = $props();

	let now = $state(browser ? Date.now() : 0);
	if (browser) {
		const interval = setInterval(() => (now = Date.now()), 30_000);
		onDestroy(() => clearInterval(interval));
	}

	const label = $derived.by(() => {
		if (!lastSaved) return '';
		const secs = Math.max(0, Math.floor((now - lastSaved.getTime()) / 1000));
		if (secs < 60) return 'Saved just now';
		const mins = Math.floor(secs / 60);
		if (mins < 60) return `Saved ${mins} min ago`;
		const hrs = Math.floor(mins / 60);
		return `Saved ${hrs} hr ago`;
	});
</script>

{#if lastSaved}
	<span
		class="glass-surface inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-muted-foreground"
	>
		<Check class="h-3 w-3 text-primary" />
		<!-- mobile has no room for the timestamp -->
		<span class="md:hidden">Saved</span>
		<span class="hidden md:inline">{label}</span>
	</span>
{/if}
