<script lang="ts">
	import { Loader2, ScanLine } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import type { SelectOption } from '$lib/types/shared';
	import type { BottleScanOutput } from '$lib/types/generators';

	let {
		onscan,
		categories = [],
		disabled = false,
	}: {
		onscan: (result: BottleScanOutput) => void;
		categories: SelectOption[];
		disabled?: boolean;
	} = $props();

	let loading = $state(false);
	let error = $state('');
	let fileInput = $state<HTMLInputElement>();

	function triggerFileInput() {
		fileInput?.click();
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// reset for next selection
		input.value = '';

		loading = true;
		error = '';

		try {
			const dataUri = await readFileAsDataUri(file);
			const categoryNames = categories.map((c) => c.name);

			const res = await fetch('/api/inventory/scan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ image: dataUri, categories: categoryNames }),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.message || 'Scan failed');
			}

			const result: BottleScanOutput = await res.json();
			onscan(result);
		} catch (err: any) {
			error = err.message || 'Failed to scan bottle';
		} finally {
			loading = false;
		}
	}

	function readFileAsDataUri(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	capture="environment"
	class="hidden"
	onchange={handleFileSelect}
/>

<Button
	type="button"
	variant="outline"
	size="sm"
	disabled={disabled || loading}
	onclick={triggerFileInput}
>
	{#if loading}
		<Loader2 class="h-4 w-4 mr-2 animate-spin" />
		Scanning...
	{:else}
		<ScanLine class="h-4 w-4 mr-2" />
		Scan Bottle
	{/if}
</Button>

{#if error}
	<p class="text-sm text-destructive mt-1">{error}</p>
{/if}
