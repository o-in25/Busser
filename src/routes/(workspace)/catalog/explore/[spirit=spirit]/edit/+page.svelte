<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	import BackButton from '$lib/components/BackButton.svelte';
	import FancyButton from '$lib/components/FancyButton.svelte';
	import ImagePrompt from '$lib/components/ImagePrompt.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	import type { PageData } from './$types';
	import { notificationStore } from '../../../../../../stores';

	let { data }: { data: PageData } = $props();

	const backHref = `/catalog/explore/${data.spiritContent.slug}`;

	let descriptionText = $state(data.spirit.recipeCategoryDescriptionText ?? '');
	let imageUrl = $state<string | null | undefined>(
		data.spirit.recipeCategoryDescriptionImageUrl ?? undefined
	);
	let pendingImageFile = $state<File | null>(null);
	let imageCleared = $state(false);
	let disabled = $state(false);
</script>

<svelte:head>
	<title>Edit {data.spiritContent.displayName} - Catalog</title>
</svelte:head>

<div class="container mx-auto max-w-2xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback={backHref} />
		<div>
			<h1 class="text-2xl font-bold">Edit Category</h1>
			<p class="text-muted-foreground">
				Update {data.spiritContent.displayName}
			</p>
		</div>
	</div>

	<form
		class="relative space-y-6"
		method="POST"
		enctype="multipart/form-data"
		use:enhance={async ({ formData }) => {
			disabled = true;

			// resolve the image: new upload, cleared, or keep existing
			if (pendingImageFile) {
				const uploadData = new FormData();
				uploadData.append('file', pendingImageFile);
				uploadData.append('kind', 'recipes');
				const res = await fetch('/api/upload/image', { method: 'POST', body: uploadData });
				const uploaded = await res.json();
				if (uploaded.url) formData.set('recipeCategoryDescriptionImageUrl', uploaded.url);
			} else if (imageCleared) {
				formData.set('recipeCategoryDescriptionImageCleared', 'true');
			}

			return async ({ result }) => {
				if (result.type === 'redirect') {
					$notificationStore.success = { message: 'Category updated.' };
					goto(result.location);
				} else {
					await applyAction(result);
					disabled = false;
					if (result.type === 'failure') {
						$notificationStore.error = { message: result?.data?.error?.toString() || '' };
					}
				}
			};
		}}
	>
		<div>
			<Label for="recipeCategoryDescriptionText" class="mb-2">Description</Label>
			<Textarea
				id="recipeCategoryDescriptionText"
				name="recipeCategoryDescriptionText"
				bind:value={descriptionText}
				rows={3}
				placeholder="A short description of this spirit category..."
			/>
		</div>

		<ImagePrompt
			name="categoryImage"
			label="Image"
			type="cocktail"
			trigger={data.spiritContent.displayName}
			description={descriptionText}
			bind:signedUrl={imageUrl}
			bind:pendingFile={pendingImageFile}
			bind:imageCleared
		/>

		<div class="flex justify-end gap-2">
			<FancyButton href={backHref} size="sm">Cancel</FancyButton>
			<FancyButton type="submit" variant="primary" size="sm" {disabled}>
				{disabled ? 'Saving...' : 'Save'}
			</FancyButton>
		</div>
	</form>
</div>
