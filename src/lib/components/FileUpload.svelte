<script lang="ts">
	import {
		Label,
		CloseButton,
	} from 'flowbite-svelte';
	import placeholder from '$lib/assets/placeholder@2x.jpg';
	import FancyImage from './FancyImage.svelte';
	
	export let name = 'image';
	export let signedUrl;
	let files: FileList | undefined;
	let fileInputRef: HTMLInputElement | undefined;

	$: src = signedUrl?.length ? signedUrl : placeholder;
	$: hasFiles = files && files.length > 0;

	export let deleted = false;

	$: {
		if (files?.length) {
			const [file] = files;
			const reader = new FileReader();
			reader.onload = ({ target }) => {
				signedUrl = target?.result?.toString() || '';
				if (signedUrl.length) {
				}
				// console.log(signedUrl, target?.result?.toString())
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

<div>
	<Label
		for={name}
		class="mb-2"
	>
		Image
	</Label>
	<div class="mb-4 flex">
		<!-- <Fileupload id={name} {name} class="mb-2" accept="image/*" bind:files={files} title="test" />  -->

		<div class="relative w-full">
			<input
				id={name}
				{name}
				type="file"
				bind:files
				bind:this={fileInputRef}
				class="block w-full disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 text-sm rounded-lg border !p-0 dark:text-gray-400"
			/>
			{#if hasFiles}
				<CloseButton
					on:click={clearAll}
					class="flex absolute inset-y-0 items-center text-gray-500 dark:text-gray-400 end-0 p-2.5"
				/>
			{/if}
		</div>

		<!-- {#if src !== placeholder}
      <Button class="ms-2 mb-2" color="alternative" on:click={clearAll}><TrashBinOutline/></Button>
    {/if} -->
	</div>
	<FancyImage
		alt="Product Thumbnail"
		{src}
		divStyle="bg-gray-700 rounded-lg p-4"
		imgStyle="object-scale-down h-48 w-96 m-auto"
	/>
	<!-- <div class="bg-gray-700 rounded-lg p-4">
    <img src="{signedUrl || placeholder}" class="object-scale-down h-48 w-96 m-auto" alt="Product Thumbnail"/>
  </div> -->
</div>
