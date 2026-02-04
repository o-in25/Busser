<script lang="ts">
	import { ImagePlus, Loader2, Sparkles, Upload, Wand2, X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';

	import placeholder from '$lib/assets/placeholder@2x.jpg';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';

	let {
		name = 'image',
		signedUrl = $bindable<string | null | undefined>(),
		trigger,
		label = 'Image',
		url = '/api/generator/image',
	}: {
		name?: string;
		signedUrl?: string | null;
		trigger?: string;
		label?: string;
		url?: string;
	} = $props();

	let files = $state<FileList | null>(null);
	let fileInputRef = $state<HTMLInputElement | null>(null);
	let isGenerating = $state(false);
	let errorMessage = $state('');
	let generationProgress = $state(0);

	let src = $derived(signedUrl?.length ? signedUrl : placeholder);
	let hasImage = $derived(signedUrl && signedUrl !== placeholder && signedUrl.length > 0);

	$effect(() => {
		if (files !== null && files.length > 0) {
			const file = files[0];
			const reader = new FileReader();
			reader.onload = ({ target }) => {
				signedUrl = target?.result?.toString() || '';
			};
			reader.readAsDataURL(file);
		}
	});

	// simulated progress animation during generation
	let progressInterval: ReturnType<typeof setInterval> | null = null;
	const startProgressAnimation = () => {
		generationProgress = 0;
		progressInterval = setInterval(() => {
			if (generationProgress < 90) {
				generationProgress += Math.random() * 15;
				if (generationProgress > 90) generationProgress = 90;
			}
		}, 500);
	};

	const stopProgressAnimation = () => {
		if (progressInterval) {
			clearInterval(progressInterval);
			progressInterval = null;
		}
		generationProgress = 100;
	};

	const clearAll = () => {
		if (fileInputRef) {
			fileInputRef.value = '';
			files = null;
			signedUrl = undefined;
			errorMessage = '';
		}
	};

	const generateImage = async () => {
		isGenerating = true;
		errorMessage = '';
		startProgressAnimation();

		try {
			if (!trigger) throw new Error('Enter a name first to generate an image.');

			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subject: trigger }),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || 'Failed to generate image');
			}

			const result = await response.json();
			if (!result.url) throw new Error('No image URL returned.');

			stopProgressAnimation();
			signedUrl = result.url;

			// convert base64 to file and attach to file input for form submission
			if (result.base64 && result.mimeType && fileInputRef) {
				const byteString = atob(result.base64);
				const ab = new ArrayBuffer(byteString.length);
				const ia = new Uint8Array(ab);
				for (let i = 0; i < byteString.length; i++) {
					ia[i] = byteString.charCodeAt(i);
				}
				const ext = result.mimeType.split('/')[1] || 'png';
				const blob = new Blob([ab], { type: result.mimeType });
				const file = new File([blob], `generated.${ext}`, { type: result.mimeType });

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				fileInputRef.files = dataTransfer.files;
				files = dataTransfer.files;
			}
		} catch (error: unknown) {
			console.error(error);
			errorMessage = error instanceof Error ? error.message : 'Could not generate image.';
		} finally {
			stopProgressAnimation();
			isGenerating = false;
		}
	};
</script>

<div class="space-y-4">
	<Label class="text-base font-medium">{label}</Label>

	<!-- image preview area -->
	<div class="relative group">
		<div
			class="glass-surface overflow-hidden rounded-2xl aspect-video max-w-md mx-auto relative {isGenerating
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
								<Wand2 class="w-12 h-12 text-primary" />
							</div>
							<Wand2 class="w-12 h-12 text-primary animate-pulse" />
						</div>

						<div class="space-y-2">
							<p class="text-sm font-medium text-foreground">Creating your image...</p>
							<p class="text-xs text-muted-foreground">
								AI is generating "{trigger}"
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

			<!-- actual image -->
			<div class="relative w-full h-full min-h-48">
				{#if hasImage && !isGenerating}
					<img
						{src}
						alt="Preview"
						class="w-full h-full object-cover rounded-xl transition-opacity duration-300"
					/>
					<!-- clear button overlay -->
					<button
						type="button"
						onclick={clearAll}
						class="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
						title="Remove image"
					>
						<X class="w-4 h-4" />
					</button>
				{:else if !isGenerating}
					<!-- placeholder state -->
					<div
						class="w-full h-full min-h-48 flex flex-col items-center justify-center gap-3 text-muted-foreground"
					>
						<ImagePlus class="w-12 h-12 opacity-40" />
						<p class="text-sm">No image selected</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- action buttons -->
	<div
		class="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-white/50 dark:bg-zinc-800/40 backdrop-blur-sm border border-input/50"
	>
		<!-- generate button -->
		<Button
			variant="default"
			class="flex-1 gap-2"
			onclick={generateImage}
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

		<!-- upload button -->
		<div class="flex-1">
			<label
				for={name}
				class="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors text-sm font-medium h-10 {isGenerating
					? 'opacity-50 pointer-events-none'
					: ''}"
			>
				<Upload class="w-4 h-4" />
				Upload Image
			</label>
			<input
				id={name}
				{name}
				type="file"
				accept="image/*"
				bind:files
				bind:this={fileInputRef}
				disabled={isGenerating}
				class="hidden"
			/>
		</div>
	</div>

	<!-- error message -->
	{#if errorMessage && !isGenerating}
		<div
			class="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"
			transition:fly={{ y: -10, duration: 200 }}
		>
			<X class="w-4 h-4 mt-0.5 shrink-0" />
			<p>{errorMessage}</p>
		</div>
	{/if}

	<!-- hint text -->
	{#if !trigger && !hasImage}
		<p class="text-xs text-muted-foreground text-center">
			Enter a name above to enable AI image generation
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
