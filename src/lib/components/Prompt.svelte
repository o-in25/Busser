<script lang="ts">
	import { Sparkle, Loader } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import { Helper } from '$lib/components/ui/helper';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	let {
		value = $bindable(''),
		label = 'Description',
		trigger,
		id,
		name,
		rows = 4,
		url,
	}: {
		value?: string;
		label?: string;
		trigger?: string;
		id: string;
		name: string;
		rows?: number;
		url: string;
	} = $props();

	let showSpinner = $state(false);
	let showHelperText = $state(false);

	const generateText = async () => {
		showSpinner = true;
		try {
			if (!trigger) throw new Error('No valid trigger present.');
			const response = await fetch(url, {
				method: 'POST',
				body: JSON.stringify({ trigger }),
			});
			const res = await response.json();
			console.log(res);
			const { description } = res;
			if (!res.description) throw new Error('Invalid response generated.');

			value = description;
		} catch (error: any) {
			console.error(error);
			showHelperText = true;
		} finally {
			showSpinner = false;
		}
	};
</script>

<Label for="textarea-id" class="mb-2">{label}</Label>
<div class="mt-3">
	<div
		class="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-zinc-800/40 backdrop-blur-sm border border-input/50"
	>
		<Button
			variant="outline"
			size="icon"
			class="shrink-0 mt-1"
			onclick={generateText}
			disabled={showSpinner}
		>
			{#if showSpinner}
				<Loader class="w-5 h-5 animate-spin" />
			{:else}
				<Sparkle class="w-5 h-5" />
				<span class="sr-only">Generate text</span>
			{/if}
		</Button>
		<Textarea
			{id}
			{name}
			{rows}
			class="flex-1 !bg-transparent !border-0 !shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
			bind:value
			disabled={showSpinner}
			placeholder="Enter a description or click the brain icon to generate one..."
		/>
	</div>
	{#if showHelperText}
		<Helper color="red" class="mt-2">Could not generate text from prompt.</Helper>
	{/if}
</div>
