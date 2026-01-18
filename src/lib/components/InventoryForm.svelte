<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Slider } from '$lib/components/ui/slider';
	import * as Dialog from '$lib/components/ui/dialog';
	import Autocomplete from './Autocomplete.svelte';
	import type { ComponentAction, FormSubmitResult, Product } from '$lib/types';
	import FileUpload from './FileUpload.svelte';
	import { applyAction, enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { notificationStore } from '../../stores';
	import { getContext } from 'svelte';
	import Prompt from './Prompt.svelte';
	import { goto } from '$app/navigation';

	export let action: ComponentAction;
	export let product: Product | null = null;

	const permissions: string[] = getContext('permissions');

	let slug = $page.params.id;
	let productName = product?.productName;
	let productPricePerUnit = product?.productPricePerUnit !== undefined ? String(product.productPricePerUnit) : '';
	let productUnitSizeInMilliliters = product?.productUnitSizeInMilliliters !== undefined ? String(product.productUnitSizeInMilliliters) : '';
	let productProof = product?.productProof !== undefined ? String(product.productProof) : '';
	let categoryId: string | null = product?.categoryId !== undefined ? String(product.categoryId) : null;
	let productImageUrl = product?.productImageUrl;
	let productInStockQuantity = product?.productInStockQuantity || 0;
	let productSweetnessRating = product?.productSweetnessRating || 0.0;
	let productDrynessRating = product?.productDrynessRating || 0.0;
	let productStrengthRating = product?.productStrengthRating || 0.0;
	let productVersatilityRating = product?.productVersatilityRating || 0.0;
	let productDescription = product?.productDescription;

	let productDetailId = product?.productDetailId;
	let modalOpen = false;

	const deleteItem = async () => {
		const response = await fetch(`/api/inventory/${slug}`, {
			method: 'DELETE',
		});

		const result = await response.json();
		if ('data' in result) {
			$notificationStore.success = { message: 'Inventory item deleted.' };
		} else {
			$notificationStore.error = { message: result.message || result.error };
		}
	};

	const openModal = () => {
		modalOpen = true;
	};
</script>

<div class="px-4 p-4 mt-3 glass-surface">
	<form
		class="relative"
		method="POST"
		action={action === 'add' ? '?/add' : '?/edit'}
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect') {
					goto(result.location);
				} else {
					await applyAction(result);
					if (result.type === 'failure')
						$notificationStore.error = {
							message: result?.data?.error?.toString() || '',
						};
					if (result.type === 'success')
						$notificationStore.success = { message: 'Inventory updated.' };
				}
			};
		}}
		enctype="multipart/form-data"
	>
		<div class="grid gap-6 mb-6 md:grid-cols-2">
			<div>
				<Label for="productName" class="mb-2">Name</Label>
				<Input
					type="text"
					id="productName"
					name="productName"
					required
					bind:value={productName}
				/>
			</div>
			<div class="w-full">
				<Autocomplete
					label="Category"
					fetchUrl="/api/select/categories"
					actionUrl="/inventory/category/add"
					name="categoryId"
					grant="add_category"
					key={product?.categoryName}
					required={true}
					bind:value={categoryId}
				/>
			</div>
		</div>
		<div class="grid gap-6 mb-6 md:grid-cols-3">
			<div>
				<Label for="productPricePerUnit" class="mb-2">Price</Label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
					<Input
						type="number"
						id="productPricePerUnit"
						name="productPricePerUnit"
						step="any"
						required
						class="pl-7"
						value={productPricePerUnit}
						oninput={(e) => productPricePerUnit = e.currentTarget.value}
					/>
				</div>
			</div>
			<div>
				<Label for="productUnitSizeInMilliliters" class="mb-2">Size</Label>
				<div class="relative">
					<Input
						type="number"
						id="productUnitSizeInMilliliters"
						name="productUnitSizeInMilliliters"
						required
						class="pr-10"
						value={productUnitSizeInMilliliters}
						oninput={(e) => productUnitSizeInMilliliters = e.currentTarget.value}
					/>
					<span class="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">mL</span>
				</div>
			</div>
			<div>
				<Label for="productProof" class="mb-2">Proof</Label>
				<Input
					type="number"
					id="productProof"
					name="productProof"
					max="200"
					required
					value={productProof}
					oninput={(e) => productProof = e.currentTarget.value}
				/>
			</div>
		</div>
		<div class="grid gap-6 mb-6 md:grid-cols-2">
			<div class="mt-4">
				<FileUpload name="productImageUrl" signedUrl={productImageUrl} />
			</div>
			<div class="space-y-6">
				<div>
					<div class="flex justify-between items-center mb-3">
						<Label for="productSweetnessRating">Sweetness</Label>
						<span class="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
							{productSweetnessRating.toFixed(1)}
						</span>
					</div>
					<input type="hidden" name="productSweetnessRating" value={productSweetnessRating} />
					<Slider
						bind:value={productSweetnessRating}
						min={0}
						max={10}
						step={0.1}
					/>
				</div>
				<div>
					<div class="flex justify-between items-center mb-3">
						<Label for="productDrynessRating">Dryness</Label>
						<span class="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
							{productDrynessRating.toFixed(1)}
						</span>
					</div>
					<input type="hidden" name="productDrynessRating" value={productDrynessRating} />
					<Slider
						bind:value={productDrynessRating}
						min={0}
						max={10}
						step={0.1}
					/>
				</div>
				<div>
					<div class="flex justify-between items-center mb-3">
						<Label for="productVersatilityRating">Versatility</Label>
						<span class="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
							{productVersatilityRating.toFixed(1)}
						</span>
					</div>
					<input type="hidden" name="productVersatilityRating" value={productVersatilityRating} />
					<Slider
						bind:value={productVersatilityRating}
						min={0}
						max={10}
						step={0.1}
					/>
				</div>
				<div>
					<div class="flex justify-between items-center mb-3">
						<Label for="productStrengthRating">Strength</Label>
						<span class="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
							{productStrengthRating.toFixed(1)}
						</span>
					</div>
					<input type="hidden" name="productStrengthRating" value={productStrengthRating} />
					<Slider
						bind:value={productStrengthRating}
						min={0}
						max={10}
						step={0.1}
					/>
				</div>
				<div class="flex items-center justify-end gap-3 pt-2">
					<input
						name="productInStockQuantity"
						type="hidden"
						bind:value={productInStockQuantity}
					/>
					<Label for="inStock" class="text-sm">In Stock</Label>
					<Switch
						id="inStock"
						checked={productInStockQuantity > 0}
						onCheckedChange={(checked) => {
							productInStockQuantity = checked ? 1 : 0;
						}}
					/>
				</div>
			</div>
		</div>
		<div class="mb-6">
			<Prompt
				bind:value={productDescription}
				trigger={productName}
				id="productDescription"
				name="productDescription"
				url="/api/generator/inventory"
			/>
		</div>

		<input type="hidden" value={productDetailId} />

		<!-- submit -->
		<div class="md:flex justify-end">
			{#if action === 'edit' && permissions.includes('delete_inventory')}
				<div class="my-4 md:mr-4">
					<Button
						variant="outline"
						class="w-full md:w-32 bg-destructive/20 border-destructive/50 text-red-400 hover:bg-destructive hover:text-destructive-foreground"
						type="button"
						size="lg"
						onclick={openModal}
					>
						Delete
					</Button>
				</div>
			{/if}
			<div class="my-4 md:mr-4 order-2">
				<Button class="w-full md:w-32" type="submit" size="lg">
					Save
				</Button>
			</div>
		</div>
	</form>

	<Dialog.Root bind:open={modalOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Confirm Delete</Dialog.Title>
				<Dialog.Description>
					Delete <span class="font-semibold">{product?.productName}</span> from inventory?
					<p class="text-destructive font-bold mt-2">
						Once deleted, it can't be recovered.
					</p>
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (modalOpen = false)}>
					Cancel
				</Button>
				<Button
					variant="destructive"
					onclick={async () => {
						await deleteItem();
						modalOpen = false;
					}}
				>
					Delete
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
