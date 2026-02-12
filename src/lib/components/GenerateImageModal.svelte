<script lang="ts">
	import { Sparkles, PenLine } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	let {
		open = $bindable(false),
		trigger = '',
		type = 'cocktail',
		ongenerate,
	}: {
		open?: boolean;
		trigger?: string;
		type?: 'cocktail' | 'product';
		ongenerate?: (mode: 'auto' | 'custom', customPrompt?: string) => void;
	} = $props();

	let mode = $state<'auto' | 'custom'>('auto');
	let customPrompt = $state('');

	// generate a helpful placeholder based on type
	let placeholder = $derived(
		type === 'product'
			? `e.g., a pile of fresh espresso beans, or a bottle of vanilla syrup`
			: `e.g., a classic ${trigger || 'cocktail'} in a coupe glass with a citrus twist garnish`
	);

	// reset state when modal opens
	$effect(() => {
		if (open) {
			mode = 'auto';
			customPrompt = '';
		}
	});

	function handleGenerate() {
		ongenerate?.(mode, mode === 'custom' ? customPrompt : undefined);
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && e.metaKey && mode === 'custom' && customPrompt.trim()) {
			handleGenerate();
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Generate Image</Dialog.Title>
			<Dialog.Description>
				Choose how to generate the image for "{trigger}"
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- auto-generate option -->
			<button
				type="button"
				class="w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left {mode ===
				'auto'
					? 'border-primary bg-primary/5'
					: 'border-input hover:border-primary/50 hover:bg-muted/50'}"
				onclick={() => (mode = 'auto')}
			>
				<div
					class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center {mode === 'auto'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'}"
				>
					<Sparkles class="w-5 h-5" />
				</div>
				<div class="flex-1 min-w-0">
					<p class="font-medium text-foreground">Auto-generate</p>
					<p class="text-sm text-muted-foreground mt-0.5">
						Generate based on the name and details provided
					</p>
					{#if trigger}
						<p class="text-xs text-muted-foreground mt-2 truncate">
							Subject: "{trigger}"
						</p>
					{/if}
				</div>
				<div
					class="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center {mode ===
					'auto'
						? 'border-primary'
						: 'border-muted-foreground/30'}"
				>
					{#if mode === 'auto'}
						<div class="w-2.5 h-2.5 rounded-full bg-primary"></div>
					{/if}
				</div>
			</button>

			<!-- custom prompt option -->
			<button
				type="button"
				class="w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left {mode ===
				'custom'
					? 'border-primary bg-primary/5'
					: 'border-input hover:border-primary/50 hover:bg-muted/50'}"
				onclick={() => (mode = 'custom')}
			>
				<div
					class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center {mode === 'custom'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'}"
				>
					<PenLine class="w-5 h-5" />
				</div>
				<div class="flex-1 min-w-0">
					<p class="font-medium text-foreground">Custom prompt</p>
					<p class="text-sm text-muted-foreground mt-0.5">
						Describe the subject you want to photograph
					</p>
				</div>
				<div
					class="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center {mode ===
					'custom'
						? 'border-primary'
						: 'border-muted-foreground/30'}"
				>
					{#if mode === 'custom'}
						<div class="w-2.5 h-2.5 rounded-full bg-primary"></div>
					{/if}
				</div>
			</button>

			<!-- custom prompt textarea -->
			{#if mode === 'custom'}
				<div class="space-y-2 pt-2">
					<Label for="custom-prompt">Your prompt</Label>
					<Textarea
						id="custom-prompt"
						bind:value={customPrompt}
						{placeholder}
						rows={3}
						class="resize-none"
						onkeydown={handleKeydown}
					/>
					<p class="text-xs text-muted-foreground">
						Describe the subject only. Studio lighting and white background will be added
						automatically.
					</p>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				type="button"
				onclick={handleGenerate}
				disabled={mode === 'custom' && !customPrompt.trim()}
			>
				<Sparkles class="w-4 h-4 mr-2" />
				Generate
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
