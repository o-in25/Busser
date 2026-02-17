<script lang="ts">
	import { Expand, ImagePlus, Loader2, Sparkles, Upload, Wand2, X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { mount, unmount } from 'svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import GenerateImageModal from './GenerateImageModal.svelte';
	import Lightbox from './Lightbox.svelte';

	let {
		name = 'image',
		signedUrl = $bindable<string | null | undefined>(),
		pendingFile = $bindable<File | null>(null),
		imageCleared = $bindable(false),
		trigger,
		label = 'Image',
		url = '/api/generator/image',
		ingredients = [],
		technique = '',
		type = 'cocktail',
		description = '',
	}: {
		name?: string;
		signedUrl?: string | null;
		pendingFile?: File | null;
		imageCleared?: boolean;
		trigger?: string;
		label?: string;
		url?: string;
		ingredients?: string[];
		technique?: string;
		type?: 'cocktail' | 'product';
		description?: string;
	} = $props();

	let files = $state<FileList | null>(null);
	let fileInputRef = $state<HTMLInputElement | null>(null);
	let isGenerating = $state(false);
	let errorMessage = $state('');
	let generationProgress = $state(0);
	let lightboxOpen = $state(false);
	let generateModalOpen = $state(false);

	let src = $derived(signedUrl || '');
	let hasImage = $derived(!!signedUrl && signedUrl.length > 0);

	$effect(() => {
		if (files !== null && files.length > 0) {
			const file = files[0];
			pendingFile = file;
			imageCleared = false;
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
		}
		files = null;
		signedUrl = undefined;
		pendingFile = null;
		imageCleared = true;
		errorMessage = '';
	};

	const generateImage = async (customPrompt?: string) => {
		isGenerating = true;
		errorMessage = '';
		startProgressAnimation();

		try {
			if (!trigger && !customPrompt) throw new Error('Enter a name first to generate an image.');

			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subject: trigger,
					ingredients: ingredients.length ? ingredients : undefined,
					technique: technique || undefined,
					type,
					description: description || undefined,
					customPrompt,
				}),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || 'Failed to generate image');
			}

			const result = await response.json();
			if (!result.base64 || !result.mimeType) throw new Error('No image data returned.');

			// Convert base64 to File and hold in memory
			const byteString = atob(result.base64);
			const ab = new ArrayBuffer(byteString.length);
			const ia = new Uint8Array(ab);
			for (let i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}
			const ext = result.mimeType.split('/')[1] || 'png';
			const blob = new Blob([ab], { type: result.mimeType });
			const file = new File([blob], `generated.${ext}`, { type: result.mimeType });

			// Create data URL for preview and preload before displaying
			const dataUrl = result.url || `data:${result.mimeType};base64,${result.base64}`;
			await new Promise<void>((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('Failed to load generated image'));
				img.src = dataUrl;
			});

			stopProgressAnimation();
			signedUrl = dataUrl;
			pendingFile = file;
			imageCleared = false;

			// Clear manual file input
			if (fileInputRef) {
				fileInputRef.value = '';
				files = null;
			}
		} catch (error: unknown) {
			console.error(error);
			errorMessage = error instanceof Error ? error.message : 'Could not generate image.';
		} finally {
			stopProgressAnimation();
			isGenerating = false;
		}
	};

	let lightboxInstance: Record<string, unknown> | null = null;
	let lightboxTarget: HTMLDivElement | null = null;

	function openLightbox() {
		if (lightboxInstance) return;
		lightboxOpen = true;
		document.body.style.overflow = 'hidden';
		lightboxTarget = document.createElement('div');
		document.body.appendChild(lightboxTarget);
		lightboxInstance = mount(Lightbox, {
			target: lightboxTarget,
			props: {
				src,
				onclose: closeLightbox,
			},
		});
	}

	function closeLightbox() {
		lightboxOpen = false;
		document.body.style.overflow = '';
		if (lightboxInstance) {
			unmount(lightboxInstance);
			lightboxInstance = null;
		}
		if (lightboxTarget) {
			lightboxTarget.remove();
			lightboxTarget = null;
		}
	}

	function handleGenerateFromModal(mode: 'auto' | 'custom', customPrompt?: string) {
		generateImage(mode === 'custom' ? customPrompt : undefined);
	}

	function openGenerateModal() {
		generateModalOpen = true;
	}
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
					<button
						type="button"
						class="w-full h-full cursor-zoom-in"
						onclick={openLightbox}
						aria-label="View full image"
					>
						<img
							{src}
							alt="Preview"
							class="w-full h-full object-cover rounded-xl transition-opacity duration-300"
						/>
					</button>
					<!-- action buttons overlay -->
					<div class="absolute top-2 right-2 flex gap-1.5">
						<button
							type="button"
							onclick={openLightbox}
							class="p-2 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 text-white shadow-lg hover:!bg-black/80 hover:!border-black/80 hover:!backdrop-blur-none active:!bg-black transition-all duration-200"
							title="Full screen preview"
						>
							<Expand class="w-4 h-4 drop-shadow" />
						</button>
						<button
							type="button"
							onclick={clearAll}
							class="p-2 rounded-full bg-red-500/40 backdrop-blur-md border border-red-300/40 dark:border-red-400/30 text-white shadow-lg hover:bg-red-600 hover:backdrop-blur-none hover:border-red-600 active:bg-red-700 transition-all duration-200"
							title="Remove image"
						>
							<X class="w-4 h-4 drop-shadow" />
						</button>
					</div>
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
			type="button"
			variant="default"
			class="flex-1 gap-2"
			onclick={openGenerateModal}
			disabled={isGenerating || !trigger}
		>
			{#if isGenerating}
				<Loader2 class="w-4 h-4 animate-spin" />
				Generating...
			{:else}
				<Sparkles class="w-4 h-4" />
				Generate with AI
				<Badge variant="secondary" class="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0 ml-1">Beta</Badge>
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

<!-- Generate Image Modal -->
<GenerateImageModal
	bind:open={generateModalOpen}
	{trigger}
	{type}
	ongenerate={handleGenerateFromModal}
/>

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
