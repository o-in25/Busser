<script lang="ts">
	import { AlertCircle, Loader2, Sparkles, Type, Wand2, X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';

	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	import { notificationStore } from '../../stores';

	let {
		value = $bindable(),
		label = 'Description',
		trigger,
		id,
		name,
		rows = 4,
		url,
		placeholder = 'Enter a description or generate one with AI...',
	}: {
		value?: string;
		label?: string;
		trigger?: string;
		id: string;
		name: string;
		rows?: number;
		url: string;
		placeholder?: string;
	} = $props();

	// ensure value is always a string for internal use
	let internalValue = $derived(value ?? '');

	// sync internal changes back to parent
	function updateValue(newValue: string) {
		value = newValue;
	}

	let isGenerating = $state(false);
	let errorMessage = $state('');
	let generationProgress = $state(0);
	let textareaWrapper = $state<HTMLDivElement | null>(null);

	let hasContent = $derived(internalValue.trim().length > 0);

	// auto-resize textarea based on content
	const autoResize = () => {
		if (!textareaWrapper) return;
		const textarea = textareaWrapper.querySelector('textarea');
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = `${Math.max(textarea.scrollHeight, 192)}px`; // 192px = min-h-48
	};

	$effect(() => {
		// trigger resize when value changes
		internalValue;
		autoResize();
	});

	// simulated progress animation during generation
	let progressInterval: ReturnType<typeof setInterval> | null = null;
	const startProgressAnimation = () => {
		generationProgress = 0;
		progressInterval = setInterval(() => {
			if (generationProgress < 90) {
				generationProgress += Math.random() * 20;
				if (generationProgress > 90) generationProgress = 90;
			}
		}, 300);
	};

	const stopProgressAnimation = () => {
		if (progressInterval) {
			clearInterval(progressInterval);
			progressInterval = null;
		}
		generationProgress = 100;
	};

	const clearContent = () => {
		updateValue('');
		errorMessage = '';
	};

	const generateText = async () => {
		isGenerating = true;
		errorMessage = '';
		startProgressAnimation();

		try {
			if (!trigger) throw new Error('Enter a name first to generate a description.');

			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ trigger }),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || 'Failed to generate description');
			}

			const result = await response.json();
			if (!result.description) throw new Error('No description returned.');

			stopProgressAnimation();
			updateValue(result.description);

			$notificationStore.success = { message: 'Description generated successfully!' };
		} catch (error: unknown) {
			console.error(error);
			errorMessage = error instanceof Error ? error.message : 'Could not generate description.';
			$notificationStore.error = { message: errorMessage };
		} finally {
			stopProgressAnimation();
			isGenerating = false;
		}
	};
</script>

<div class="space-y-4">
	<Label for={id} class="text-base font-medium">{label}</Label>

	<!-- text area container -->
	<div class="relative group">
		<div
			class="glass-surface overflow-hidden rounded-2xl relative min-h-48 {isGenerating
				? 'ring-2 ring-primary/30'
				: ''}"
		>
			{#if isGenerating}
				<!-- generating overlay -->
				<div
					class="absolute inset-0 z-10 flex flex-col items-center justify-center"
					transition:fade={{ duration: 200 }}
				>
					<!-- animated glass background -->
					<div class="absolute inset-0 glass-generating"></div>

					<!-- content -->
					<div class="relative z-10 flex flex-col items-center gap-4 p-6 text-center">
						<div class="relative">
							<div class="absolute inset-0 animate-ping opacity-30">
								<Wand2 class="w-10 h-10 text-primary" />
							</div>
							<Wand2 class="w-10 h-10 text-primary animate-pulse" />
						</div>

						<div class="space-y-2">
							<p class="text-sm font-medium text-foreground">Writing description...</p>
							<p class="text-xs text-muted-foreground">
								AI is describing "{trigger}"
							</p>
						</div>

						<!-- progress bar -->
						<div class="w-48 h-1.5 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full overflow-hidden">
							<div
								class="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full transition-all duration-300 ease-out shimmer"
								style="width: {generationProgress}%"
							></div>
						</div>
					</div>
				</div>
			{/if}

			<!-- textarea wrapper -->
			<div class="relative min-h-48" bind:this={textareaWrapper}>
				{#if !hasContent && !isGenerating}
					<!-- empty state icon -->
					<div
						class="absolute top-4 left-4 text-muted-foreground/40 pointer-events-none"
						transition:fade={{ duration: 150 }}
					>
						<Type class="w-8 h-8" />
					</div>
				{/if}

				<Textarea
					{id}
					{name}
					{rows}
					class="w-full min-h-48 resize-none bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4 pr-12 pb-8 {!hasContent &&
					!isGenerating
						? 'pl-14'
						: ''} {isGenerating ? 'opacity-30' : ''}"
					value={internalValue}
					disabled={isGenerating}
					{placeholder}
					oninput={(e) => {
						updateValue(e.currentTarget.value);
						autoResize();
					}}
				/>

				<!-- clear button -->
				{#if hasContent && !isGenerating}
					<button
						type="button"
						onclick={clearContent}
						class="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-500/10 hover:bg-zinc-500/20 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200"
						title="Clear description"
						transition:fade={{ duration: 150 }}
					>
						<X class="w-4 h-4" />
					</button>
				{/if}

				<!-- character count -->
				{#if hasContent && !isGenerating}
					<div
						class="absolute bottom-2 right-3 text-xs text-muted-foreground/60"
						transition:fade={{ duration: 150 }}
					>
						{internalValue.length} chars
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- generate button -->
	<div class="flex gap-3">
		<Button
			variant="default"
			class="gap-2"
			onclick={generateText}
			disabled={isGenerating || !trigger}
		>
			{#if isGenerating}
				<Loader2 class="w-4 h-4 animate-spin" />
				Generating...
			{:else}
				<Sparkles class="w-4 h-4" />
				Generate with AI
			{/if}
		</Button>

		{#if hasContent}
			<Button variant="outline" class="gap-2" onclick={clearContent} disabled={isGenerating}>
				<X class="w-4 h-4" />
				Clear
			</Button>
		{/if}
	</div>

	<!-- error message -->
	{#if errorMessage && !isGenerating}
		<div
			class="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"
			transition:fly={{ y: -10, duration: 200 }}
		>
			<AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
			<p>{errorMessage}</p>
		</div>
	{/if}

	<!-- hint text -->
	{#if !trigger && !hasContent}
		<p class="text-xs text-muted-foreground">
			Enter a name above to enable AI description generation
		</p>
	{/if}
</div>

<style>
	.glass-generating {
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.6) 0%,
			rgba(255, 255, 255, 0.3) 50%,
			rgba(255, 255, 255, 0.6) 100%
		);
		backdrop-filter: blur(12px);
		animation: glass-shimmer 2s ease-in-out infinite;
	}

	:global(.dark) .glass-generating {
		background: linear-gradient(
			135deg,
			rgba(39, 39, 42, 0.8) 0%,
			rgba(39, 39, 42, 0.5) 50%,
			rgba(39, 39, 42, 0.8) 100%
		);
	}

	@keyframes glass-shimmer {
		0%,
		100% {
			background-position: 0% 50%;
			opacity: 0.9;
		}
		50% {
			background-position: 100% 50%;
			opacity: 1;
		}
	}

	.shimmer {
		background-size: 200% 100%;
		animation: shimmer-move 1.5s linear infinite;
	}

	@keyframes shimmer-move {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
