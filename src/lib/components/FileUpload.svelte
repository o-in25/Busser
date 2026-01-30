<script lang="ts">
	import { Upload, X } from 'lucide-svelte';

	import placeholder from '$lib/assets/placeholder@2x.jpg';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import FancyImage from './FancyImage.svelte';

	export let name = 'image';
	export let signedUrl: string | undefined;
	let files: FileList | undefined;
	let fileInputRef: HTMLInputElement | undefined;

	$: src = signedUrl?.length ? signedUrl : placeholder;
	$: hasFiles = files && files.length > 0;
	$: fileNames = files
		? Array.from(files)
				.map((file) => file.name)
				.join(', ')
		: 'No files selected';

	export let deleted = false;

	$: {
		if (files?.length) {
			const [file] = files;
			const reader = new FileReader();
			reader.onload = ({ target }) => {
				signedUrl = target?.result?.toString() || '';
			};
			reader.readAsDataURL(file);
		}
	}

	const clearAll = () => {
		if (fileInputRef) {
			fileInputRef.value = '';
			files = undefined;
			signedUrl = placeholder;
			deleted = true;
		}
	};
</script>

<div class="relative">
	<Label class="mb-2">Image</Label>
	<div class="mb-4 flex">
		<div class="w-full">
			<div class="flex group">
				<label
					for={name}
					class="flex items-center justify-center px-4 border border-r-0 border-input/50 rounded-l-lg bg-white/50 dark:bg-zinc-800/40 backdrop-blur-sm hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer transition-all duration-200 group-focus-within:border-primary/50 group-focus-within:bg-primary/5"
				>
					<Upload
						class="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
					/>
				</label>
				<input id={name} {name} type="file" bind:files bind:this={fileInputRef} class="hidden" />
				<Input
					value={fileNames}
					disabled
					class="rounded-l-none border-l-0 {hasFiles ? 'rounded-r-none' : ''}"
				/>
				{#if hasFiles}
					<Button
						variant="ghost"
						size="icon"
						onclick={clearAll}
						class="rounded-l-none border border-l-0 border-input/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
					>
						<X class="w-4 h-4" />
					</Button>
				{/if}
			</div>
		</div>
	</div>
	<div class="glass-surface p-4 overflow-hidden">
		<FancyImage
			alt="Product Thumbnail"
			{src}
			divStyle="rounded-lg"
			imgStyle="object-scale-down h-48 w-96 m-auto rounded-md"
		/>
	</div>
</div>
