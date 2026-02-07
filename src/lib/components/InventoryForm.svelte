<script lang="ts">
	import {
		Calculator,
		Candy,
		DollarSign,
		Flame,
		Image,
		Package,
		Palette,
		Percent,
		Sparkles,
		Wind,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { CalculatedBadge } from '$lib/components/ui/calculated-badge';
	import * as Card from '$lib/components/ui/card';
	import { CollapsibleSection } from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { FlavorSlider } from '$lib/components/ui/flavor-slider';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { QuickSelect } from '$lib/components/ui/quick-select';
	import { Switch } from '$lib/components/ui/switch';
	import type { ComponentAction, Product } from '$lib/types';

	import { notificationStore } from '../../stores';
	import Autocomplete from './Autocomplete.svelte';
	import FormDraftManager from './FormDraftManager.svelte';
	import ImagePrompt from './ImagePrompt.svelte';
	import InventoryFormWizard from './InventoryFormWizard.svelte';
	import Prompt from './Prompt.svelte';

	let { action, product = null }: { action: ComponentAction; product?: Product | null } = $props();

	// get workspace role for permission checks
	const workspace = getContext<{ workspaceRole?: string }>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	let slug = $page.params.id;
	let productName = $state('');
	let productPricePerUnit = $state('');
	let productUnitSizeInMilliliters = $state('');
	let productProof = $state('');
	let categoryId = $state<string | null>(null);
	let productImageUrl = $state<string | undefined>();
	let productInStockQuantity = $state(0);
	let productSweetnessRating = $state(0.0);
	let productDrynessRating = $state(0.0);
	let productStrengthRating = $state(0.0);
	let productVersatilityRating = $state(0.0);
	let productDescription = $state('');

	// Pending image state (held in memory until form save)
	let pendingImageFile = $state<File | null>(null);
	let imageCleared = $state(false);

	// Sync state with product changes
	$effect(() => {
		if (product) {
			productName = product.productName ?? '';
			productPricePerUnit =
				product.productPricePerUnit !== undefined ? String(product.productPricePerUnit) : '';
			productUnitSizeInMilliliters =
				product.productUnitSizeInMilliliters !== undefined
					? String(product.productUnitSizeInMilliliters)
					: '';
			productProof = product.productProof !== undefined ? String(product.productProof) : '';
			categoryId = product.categoryId !== undefined ? String(product.categoryId) : null;
			productImageUrl = product.productImageUrl;
			productInStockQuantity = product.productInStockQuantity ?? 0;
			productSweetnessRating = product.productSweetnessRating ?? 0.0;
			productDrynessRating = product.productDrynessRating ?? 0.0;
			productStrengthRating = product.productStrengthRating ?? 0.0;
			productVersatilityRating = product.productVersatilityRating ?? 0.0;
			productDescription = product.productDescription ?? '';
		}
	});

	// Use a derived value so it always reflects the latest product
	let productDetailId = $derived(() => product?.productDetailId);
	let modalOpen = $state(false);
	let draftManager = $state<FormDraftManager>();
	let currentWizardStep = $state(0);

	// Calculated fields
	let pricePerOunce = $derived(() => {
		const price = parseFloat(productPricePerUnit);
		const size = parseFloat(productUnitSizeInMilliliters);
		if (isNaN(price) || isNaN(size) || size === 0) return null;
		return (price / (size / 29.5735)).toFixed(2);
	});

	let abvPercent = $derived(() => {
		const proof = parseFloat(productProof);
		if (isNaN(proof)) return null;
		return (proof / 2).toFixed(1);
	});

	let pricePerMl = $derived(() => {
		const price = parseFloat(productPricePerUnit);
		const size = parseFloat(productUnitSizeInMilliliters);
		if (isNaN(price) || isNaN(size) || size === 0) return null;
		return (price / size).toFixed(3);
	});

	// Quick select options
	const sizeOptions = [
		{ label: '50mL', value: '50' },
		{ label: '200mL', value: '200' },
		{ label: '375mL', value: '375' },
		{ label: '750mL', value: '750' },
		{ label: '1000mL', value: '1000' },
	];

	const proofOptions = [
		{ label: '80', value: '80' },
		{ label: '86', value: '86' },
		{ label: '90', value: '90' },
		{ label: '100', value: '100' },
	];

	// Wizard steps configuration
	const wizardSteps = [
		{ title: 'Basic Info', icon: Package },
		{ title: 'Purchase Details', icon: DollarSign },
		{ title: 'Flavor Profile', icon: Palette },
		{ title: 'Description & Image', icon: Image },
	];

	// Draft data for autosave
	let draftData = $derived({
		productName,
		productPricePerUnit,
		productUnitSizeInMilliliters,
		productProof,
		categoryId,
		productInStockQuantity,
		productSweetnessRating,
		productDrynessRating,
		productStrengthRating,
		productVersatilityRating,
		productDescription,
	});

	function handleDraftRestore(data: Record<string, unknown>) {
		productName = (data.productName as string) ?? '';
		productPricePerUnit = (data.productPricePerUnit as string) ?? '';
		productUnitSizeInMilliliters = (data.productUnitSizeInMilliliters as string) ?? '';
		productProof = (data.productProof as string) ?? '';
		categoryId = (data.categoryId as string | null) ?? null;
		productInStockQuantity = (data.productInStockQuantity as number) ?? 0;
		productSweetnessRating = (data.productSweetnessRating as number) ?? 0;
		productDrynessRating = (data.productDrynessRating as number) ?? 0;
		productStrengthRating = (data.productStrengthRating as number) ?? 0;
		productVersatilityRating = (data.productVersatilityRating as number) ?? 0;
		productDescription = (data.productDescription as string) ?? '';
	}

	const deleteItem = async () => {
		const response = await fetch(`/api/inventory/${slug}`, {
			method: 'DELETE',
		});

		const result = await response.json();
		if ('data' in result) {
			$notificationStore.success = { message: 'Inventory item deleted.' };
			goto('/inventory');
		} else {
			$notificationStore.error = { message: result.message || result.error };
		}
	};

	const openModal = () => {
		modalOpen = true;
	};

	// Validation state
	let touched = $state({
		productName: false,
		categoryId: false,
		productPricePerUnit: false,
		productUnitSizeInMilliliters: false,
		productProof: false,
	});

	const errors = $derived({
		productName: !productName.trim() ? 'Product name is required' : '',
		categoryId: !categoryId ? 'Category is required' : '',
		productPricePerUnit: !productPricePerUnit ? 'Price is required' : '',
		productUnitSizeInMilliliters: !productUnitSizeInMilliliters ? 'Size is required' : '',
		productProof: !productProof ? 'Proof is required' : '',
	});

	// Step-based validation for wizard
	const stepValid = $derived({
		0: !!productName.trim() && !!categoryId, // name + category required
		1: !!productPricePerUnit && !!productUnitSizeInMilliliters && !!productProof, // purchase details
		2: true, // flavor profile optional
		3: true, // description optional
	});
	const canProceedWizard = $derived(stepValid[currentWizardStep as keyof typeof stepValid] ?? true);
	const isFormValid = $derived(stepValid[0] && stepValid[1]);

	// Track categoryId changes to mark as touched
	$effect(() => {
		if (categoryId !== null) {
			touched.categoryId = true;
		}
	});
</script>

<!-- Draft Manager (only for add mode) -->
{#if action === 'add'}
	<FormDraftManager
		bind:this={draftManager}
		draftKey="inventory-form"
		data={draftData}
		onrestore={handleDraftRestore}
	/>
{/if}

<div class="px-4 p-4 mt-3">
	<form
		class="relative"
		method="POST"
		action={action === 'add' ? '?/add' : '?/edit'}
		use:enhance={async ({ formData }) => {
			// Upload pending image if any (held in memory until now)
			if (pendingImageFile) {
				const uploadData = new FormData();
				uploadData.append('file', pendingImageFile);
				const res = await fetch('/api/upload/image', { method: 'POST', body: uploadData });
				const data = await res.json();
				if (data.url) {
					formData.set('productImageUrl', data.url);
				}
			} else if (imageCleared) {
				formData.set('productImageCleared', 'true');
			}

			return async ({ result }) => {
				if (result.type === 'redirect') {
					draftManager?.clearDraft();
					$notificationStore.success = { message: 'Inventory updated.' };
					goto(result.location);
				} else {
					await applyAction(result);
					if (result.type === 'failure')
						$notificationStore.error = {
							message: result?.data?.error?.toString() || '',
						};
					if (result.type === 'success') {
						draftManager?.clearDraft();
						$notificationStore.success = { message: 'Inventory updated.' };
					}
				}
			};
		}}
		enctype="multipart/form-data"
	>
		<!-- Mobile Wizard View -->
		<InventoryFormWizard steps={wizardSteps} bind:currentStep={currentWizardStep} canProceed={canProceedWizard}>
			{#snippet children({ step })}
				{#if step === 0}
					<!-- Basic Info Step -->
					<div class="space-y-4">
						<div>
							<Label for="productName" class="mb-2">
								Name <span class="text-destructive">*</span>
							</Label>
							<Input
								type="text"
								id="productName"
								name="productName"
								required
								bind:value={productName}
								onblur={() => (touched.productName = true)}
								class={touched.productName && errors.productName ? 'border-destructive' : ''}
							/>
							{#if touched.productName && errors.productName}
								<Helper color="red">{errors.productName}</Helper>
							{/if}
						</div>
						<div>
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
							{#if touched.categoryId && errors.categoryId}
								<Helper color="red">{errors.categoryId}</Helper>
							{/if}
						</div>
					</div>
				{:else if step === 1}
					<!-- Purchase Details Step -->
					<div class="space-y-4">
						<div>
							<Label for="productPricePerUnit-mobile" class="mb-2">
								Price <span class="text-destructive">*</span>
							</Label>
							<div class="relative">
								<span
									class="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground"
									>$</span
								>
								<Input
									type="number"
									id="productPricePerUnit-mobile"
									step="any"
									required
									class="pl-7 {touched.productPricePerUnit && errors.productPricePerUnit ? 'border-destructive' : ''}"
									value={productPricePerUnit}
									oninput={(e) => (productPricePerUnit = e.currentTarget.value)}
									onblur={() => (touched.productPricePerUnit = true)}
								/>
							</div>
							{#if touched.productPricePerUnit && errors.productPricePerUnit}
								<Helper color="red">{errors.productPricePerUnit}</Helper>
							{/if}
						</div>
						<div>
							<Label for="productUnitSizeInMilliliters-mobile" class="mb-2">
								Size <span class="text-destructive">*</span>
							</Label>
							<div class="relative">
								<Input
									type="number"
									id="productUnitSizeInMilliliters-mobile"
									required
									class="pr-10 {touched.productUnitSizeInMilliliters && errors.productUnitSizeInMilliliters ? 'border-destructive' : ''}"
									value={productUnitSizeInMilliliters}
									oninput={(e) => (productUnitSizeInMilliliters = e.currentTarget.value)}
									onblur={() => (touched.productUnitSizeInMilliliters = true)}
								/>
								<span
									class="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground"
									>mL</span
								>
							</div>
							{#if touched.productUnitSizeInMilliliters && errors.productUnitSizeInMilliliters}
								<Helper color="red">{errors.productUnitSizeInMilliliters}</Helper>
							{/if}
							<QuickSelect
								options={sizeOptions}
								bind:value={productUnitSizeInMilliliters}
								class="mt-2"
							/>
						</div>
						<div>
							<Label for="productProof-mobile" class="mb-2">
								Proof <span class="text-destructive">*</span>
							</Label>
							<Input
								type="number"
								id="productProof-mobile"
								max="200"
								required
								class={touched.productProof && errors.productProof ? 'border-destructive' : ''}
								value={productProof}
								oninput={(e) => (productProof = e.currentTarget.value)}
								onblur={() => (touched.productProof = true)}
							/>
							{#if touched.productProof && errors.productProof}
								<Helper color="red">{errors.productProof}</Helper>
							{/if}
							<QuickSelect options={proofOptions} bind:value={productProof} class="mt-2" />
						</div>
						<div class="flex flex-wrap gap-2 pt-2">
							{#if pricePerOunce()}
								<CalculatedBadge label="Price/oz" value={'$' + pricePerOunce()} icon={Calculator} />
							{/if}
							{#if pricePerMl()}
								<CalculatedBadge label="Price/mL" value={'$' + pricePerMl()} icon={Calculator} />
							{/if}
							{#if abvPercent()}
								<CalculatedBadge label="ABV" value={abvPercent() ?? ''} unit="%" icon={Percent} />
							{/if}
						</div>
						<div class="flex items-center justify-end gap-3 pt-2">
							<Label for="inStock-mobile" class="text-sm">In Stock</Label>
							<Switch
								id="inStock-mobile"
								checked={productInStockQuantity > 0}
								onCheckedChange={(checked) => {
									productInStockQuantity = checked ? 1 : 0;
								}}
							/>
						</div>
					</div>
				{:else if step === 2}
					<!-- Flavor Profile Step -->
					<div class="space-y-6">
						<FlavorSlider
							bind:value={productSweetnessRating}
							label="Sweetness"
							name="productSweetnessRating-mobile"
							icon={Candy}
							color="pink"
						/>
						<FlavorSlider
							bind:value={productDrynessRating}
							label="Dryness"
							name="productDrynessRating-mobile"
							icon={Wind}
							color="amber"
						/>
						<FlavorSlider
							bind:value={productVersatilityRating}
							label="Versatility"
							name="productVersatilityRating-mobile"
							icon={Sparkles}
							color="purple"
						/>
						<FlavorSlider
							bind:value={productStrengthRating}
							label="Strength"
							name="productStrengthRating-mobile"
							icon={Flame}
							color="orange"
						/>
					</div>
				{:else if step === 3}
					<!-- Description Step -->
					<div class="space-y-6">
						<Prompt
							bind:value={productDescription}
							trigger={productName}
							id="productDescription-mobile"
							name="productDescription-mobile"
							url="/api/generator/inventory"
						/>
						<ImagePrompt
							name="productImageUrl"
							bind:signedUrl={productImageUrl}
							bind:pendingFile={pendingImageFile}
							bind:imageCleared
							trigger={productName}
							type="product"
							description={productDescription}
						/>
					</div>
				{/if}
			{/snippet}
		</InventoryFormWizard>

		<!-- Desktop Card Layout (hidden on mobile) -->
		<div class="hidden md:block space-y-6">
			<!-- Basic Information Card -->
			<Card.Root class="relative z-10">
				<Card.Header class="pb-4">
					<Card.Title class="flex items-center gap-2 text-lg">
						<Package class="h-5 w-5 text-primary" />
						Basic Information
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="grid gap-6 md:grid-cols-2">
						<div>
							<Label for="productName" class="mb-2">
								Name <span class="text-destructive">*</span>
							</Label>
							<Input
								type="text"
								id="productName"
								name="productName"
								required
								bind:value={productName}
								onblur={() => (touched.productName = true)}
								class={touched.productName && errors.productName ? 'border-destructive' : ''}
							/>
							{#if touched.productName && errors.productName}
								<Helper color="red">{errors.productName}</Helper>
							{/if}
						</div>
						<div>
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
							{#if touched.categoryId && errors.categoryId}
								<Helper color="red">{errors.categoryId}</Helper>
							{/if}
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Purchase Details Card -->
			<Card.Root>
				<Card.Header class="pb-4">
					<Card.Title class="flex items-center gap-2 text-lg">
						<DollarSign class="h-5 w-5 text-primary" />
						Purchase Details
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="grid gap-6 md:grid-cols-3">
						<div>
							<Label for="productPricePerUnit" class="mb-2">
								Price <span class="text-destructive">*</span>
							</Label>
							<div class="relative">
								<span
									class="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground"
									>$</span
								>
								<Input
									type="number"
									id="productPricePerUnit"
									name="productPricePerUnit"
									step="any"
									required
									class="pl-7 {touched.productPricePerUnit && errors.productPricePerUnit ? 'border-destructive' : ''}"
									value={productPricePerUnit}
									oninput={(e) => (productPricePerUnit = e.currentTarget.value)}
									onblur={() => (touched.productPricePerUnit = true)}
								/>
							</div>
							{#if touched.productPricePerUnit && errors.productPricePerUnit}
								<Helper color="red">{errors.productPricePerUnit}</Helper>
							{/if}
						</div>
						<div>
							<Label for="productUnitSizeInMilliliters" class="mb-2">
								Size <span class="text-destructive">*</span>
							</Label>
							<div class="relative">
								<Input
									type="number"
									id="productUnitSizeInMilliliters"
									name="productUnitSizeInMilliliters"
									required
									class="pr-10 {touched.productUnitSizeInMilliliters && errors.productUnitSizeInMilliliters ? 'border-destructive' : ''}"
									value={productUnitSizeInMilliliters}
									oninput={(e) => (productUnitSizeInMilliliters = e.currentTarget.value)}
									onblur={() => (touched.productUnitSizeInMilliliters = true)}
								/>
								<span
									class="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground"
									>mL</span
								>
							</div>
							{#if touched.productUnitSizeInMilliliters && errors.productUnitSizeInMilliliters}
								<Helper color="red">{errors.productUnitSizeInMilliliters}</Helper>
							{/if}
							<QuickSelect
								options={sizeOptions}
								bind:value={productUnitSizeInMilliliters}
								class="mt-2"
							/>
						</div>
						<div>
							<Label for="productProof" class="mb-2">
								Proof <span class="text-destructive">*</span>
							</Label>
							<Input
								type="number"
								id="productProof"
								name="productProof"
								max="200"
								required
								class={touched.productProof && errors.productProof ? 'border-destructive' : ''}
								value={productProof}
								oninput={(e) => (productProof = e.currentTarget.value)}
								onblur={() => (touched.productProof = true)}
							/>
							{#if touched.productProof && errors.productProof}
								<Helper color="red">{errors.productProof}</Helper>
							{/if}
							<QuickSelect options={proofOptions} bind:value={productProof} class="mt-2" />
						</div>
					</div>

					<!-- Calculated fields and stock -->
					<div class="flex flex-wrap items-center justify-between mt-6 pt-4 border-t">
						<div class="flex flex-wrap gap-3">
							{#if pricePerOunce()}
								<CalculatedBadge label="Price/oz" value={'$' + pricePerOunce()} icon={Calculator} />
							{/if}
							{#if pricePerMl()}
								<CalculatedBadge label="Price/mL" value={'$' + pricePerMl()} icon={Calculator} />
							{/if}
							{#if abvPercent()}
								<CalculatedBadge label="ABV" value={abvPercent() ?? ''} unit="%" icon={Percent} />
							{/if}
						</div>
						<div class="flex items-center gap-3">
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
				</Card.Content>
			</Card.Root>

			<!-- Flavor Profile Card (Collapsible) -->
			<CollapsibleSection title="Flavor Profile" icon={Palette} open={action === 'edit'}>
				<div class="grid gap-6 md:grid-cols-2">
					<FlavorSlider
						bind:value={productSweetnessRating}
						label="Sweetness"
						name="productSweetnessRating"
						icon={Candy}
						color="pink"
					/>
					<FlavorSlider
						bind:value={productDrynessRating}
						label="Dryness"
						name="productDrynessRating"
						icon={Wind}
						color="amber"
					/>
					<FlavorSlider
						bind:value={productVersatilityRating}
						label="Versatility"
						name="productVersatilityRating"
						icon={Sparkles}
						color="purple"
					/>
					<FlavorSlider
						bind:value={productStrengthRating}
						label="Strength"
						name="productStrengthRating"
						icon={Flame}
						color="orange"
					/>
				</div>
			</CollapsibleSection>

			<!-- Description & Image (Collapsible) -->
			<CollapsibleSection title="Description & Image" icon={Image} open={action === 'edit'}>
				<div class="space-y-6">
					<Prompt
						bind:value={productDescription}
						trigger={productName}
						id="productDescription"
						name="productDescription"
						url="/api/generator/inventory"
					/>
					<ImagePrompt
						name="productImageUrl"
						bind:signedUrl={productImageUrl}
						bind:pendingFile={pendingImageFile}
						bind:imageCleared
						trigger={productName}
						type="product"
						description={productDescription}
					/>
				</div>
			</CollapsibleSection>
		</div>

		<!-- Hidden inputs for form submission (mobile wizard uses these) -->
		<div class="hidden">
			<input type="hidden" name="productName" value={productName} />
			<input type="hidden" name="productPricePerUnit" value={productPricePerUnit} />
			<input
				type="hidden"
				name="productUnitSizeInMilliliters"
				value={productUnitSizeInMilliliters}
			/>
			<input type="hidden" name="productProof" value={productProof} />
			<input type="hidden" name="categoryId" value={categoryId ?? ''} />
			<input type="hidden" name="productInStockQuantity" value={productInStockQuantity} />
			<input type="hidden" name="productSweetnessRating" value={productSweetnessRating} />
			<input type="hidden" name="productDrynessRating" value={productDrynessRating} />
			<input type="hidden" name="productVersatilityRating" value={productVersatilityRating} />
			<input type="hidden" name="productStrengthRating" value={productStrengthRating} />
			<input type="hidden" name="productDescription" value={productDescription} />
			<input type="hidden" value={productDetailId()} />
		</div>

		<!-- Submit buttons (desktop only - mobile uses wizard buttons) -->
		<div class="hidden md:flex justify-end gap-3 mt-6">
			{#if action === 'edit' && canModify}
				<Button type="button" variant="destructive" onclick={openModal}>
					Delete
				</Button>
			{/if}
			<Button type="submit" disabled={!isFormValid}>Save</Button>
		</div>

		<!-- Mobile delete section -->
		{#if action === 'edit' && canModify}
			<div class="md:hidden mt-6 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
				<p class="text-sm text-muted-foreground mb-3">Danger Zone</p>
				<Button
					type="button"
					variant="destructive"
					class="w-full"
					onclick={openModal}
				>
					Delete Item
				</Button>
			</div>
		{/if}
	</form>

	<Dialog.Root bind:open={modalOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Confirm Delete</Dialog.Title>
				<Dialog.Description>
					Delete <span class="font-semibold">{product?.productName}</span> from inventory?
					<p class="text-destructive font-bold mt-2">Once deleted, it can't be recovered.</p>
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (modalOpen = false)}>Cancel</Button>
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
