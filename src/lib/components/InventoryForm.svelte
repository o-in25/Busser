<script lang="ts">
	import {
		Calculator,
		Candy,
		DollarSign,
		Flame,
		Image,
		Loader2,
		Package,
		Palette,
		Percent,
		Sparkles,
		Wind,
	} from 'lucide-svelte';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { CalculatedBadge } from '$lib/components/ui/calculated-badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import { FlavorSlider } from '$lib/components/ui/flavor-slider';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { QuickSelect } from '$lib/components/ui/quick-select';
	import { Switch } from '$lib/components/ui/switch';
	import type { ComponentAction, Product, SelectOption } from '$lib/types';
	import type { BottleScanOutput } from '$lib/types/generators';

	import { notificationStore } from '../../stores';
	import Autocomplete from './Autocomplete.svelte';
	import BottleScan from './BottleScan.svelte';
	import FormDraftManager from './FormDraftManager.svelte';
	import ImagePrompt from './ImagePrompt.svelte';
	import Prompt from './Prompt.svelte';
	import FormShell from './form/FormShell.svelte';
	import SearchableSelect from './form/SearchableSelect.svelte';

	let {
		action,
		product = null,
		isShared = false,
	}: {
		action: ComponentAction;
		product?: Product | null;
		isShared?: boolean;
	} = $props();

	let productName = $state('');
	let productPricePerUnit = $state('');
	let productUnitSizeInMilliliters = $state('');
	let productProof = $state('');
	let categoryId = $state<string | null>(null);
	let supplierId = $state<string | null>(null);
	let productImageUrl = $state<string | undefined>();
	let productInStockQuantity = $state(0);
	let productSweetnessRating = $state(0.0);
	let productDrynessRating = $state(0.0);
	let productStrengthRating = $state(0.0);
	let productVersatilityRating = $state(0.0);
	let productDescription = $state('');
	let categoryGroupId = $state<number | null>(product?.categoryGroupId ?? null);
	let categoryName = $state(product?.categoryName ?? '');
	let ratingsGenerating = $state(false);

	// whether the selected category is a spirit (CategoryGroupId 1)
	const isSpirit = $derived(categoryGroupId === 1);

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
			supplierId = product.supplierId ? String(product.supplierId) : '1';
			productImageUrl = product.productImageUrl;
			productInStockQuantity = product.productInStockQuantity ?? 0;
			productSweetnessRating = product.productSweetnessRating ?? 0.0;
			productDrynessRating = product.productDrynessRating ?? 0.0;
			productStrengthRating = product.productStrengthRating ?? 0.0;
			productVersatilityRating = product.productVersatilityRating ?? 0.0;
			productDescription = product.productDescription ?? '';
			categoryGroupId = product.categoryGroupId ?? null;
			categoryName = product.categoryName ?? '';
		}
	});

	let draftManager = $state<FormDraftManager>();
	let draftLastSaved = $state<Date | null>(null);
	let currentStep = $state(0);
	let disabled = $state(false);

	// bottle scan state
	let scanCategories = $state<SelectOption[]>([]);

	$effect(() => {
		if (action === 'add') {
			fetch('/api/select/categories')
				.then((r) => r.json())
				.then((data) => (scanCategories = data));
		}
	});

	function handleBottleScan(result: BottleScanOutput) {
		productName = result.productName;
		productProof = String(result.proof);
		productUnitSizeInMilliliters = String(result.sizeInMilliliters);
		productDescription = result.description;

		// match category by name (case-insensitive)
		const match = scanCategories.find(
			(c) => c.name.toLowerCase() === result.category.toLowerCase()
		);
		if (match) {
			categoryId = String(match.value);
		}
	}

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

	// step config for the shell
	const formSteps = [
		{ title: 'Basic Info', icon: Package },
		{ title: 'Purchase Details', icon: DollarSign },
		{ title: 'Flavor Profile', icon: Palette, optional: true },
		{ title: 'Description & Image', icon: Image, optional: true },
	];

	// picking a catalog suggestion in the name field prompts to add it straight to stock
	let selectedGlobal = $state<SelectOption | null>(null);
	let confirmOpen = $state(false);
	let confirmForm = $state<HTMLFormElement>();

	function handleGlobalSelect(item: SelectOption) {
		selectedGlobal = item;
		confirmOpen = true;
	}

	// Draft data for autosave
	let draftData = $derived({
		productName,
		productPricePerUnit,
		productUnitSizeInMilliliters,
		productProof,
		categoryId,
		supplierId,
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
		supplierId = (data.supplierId as string | null) ?? null;
		productInStockQuantity = (data.productInStockQuantity as number) ?? 0;
		productSweetnessRating = (data.productSweetnessRating as number) ?? 0;
		productDrynessRating = (data.productDrynessRating as number) ?? 0;
		productStrengthRating = (data.productStrengthRating as number) ?? 0;
		productVersatilityRating = (data.productVersatilityRating as number) ?? 0;
		productDescription = (data.productDescription as string) ?? '';
	}

	function handleCategorySelect(item: SelectOption) {
		categoryGroupId = item.categoryGroupId ?? null;
		categoryName = item.name;
	}

	async function generateFlavorRatings() {
		if (!productName || !categoryName) {
			$notificationStore.error = {
				message: 'Please add a product name and select a category first.',
			};
			return;
		}

		ratingsGenerating = true;
		try {
			const response = await fetch('/api/generator/product-rating', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productName,
					categoryName,
					proof: productProof ? parseFloat(productProof) : undefined,
					description: productDescription || undefined,
				}),
			});

			if (!response.ok) throw new Error('Failed to generate ratings');

			const data = await response.json();
			productSweetnessRating = data.sweetnessRating;
			productDrynessRating = data.drynessRating;
			productVersatilityRating = data.versatilityRating;
			productStrengthRating = data.strengthRating;
		} catch (error) {
			console.error('Failed to generate ratings:', error);
			$notificationStore.error = { message: 'Failed to generate flavor ratings.' };
		} finally {
			ratingsGenerating = false;
		}
	}

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
	const canProceed = $derived(stepValid[currentStep as keyof typeof stepValid] ?? true);
	const isFormValid = $derived(stepValid[0] && stepValid[1] && !isShared);

	// Track categoryId changes to mark as touched
	$effect(() => {
		if (categoryId !== null) {
			touched.categoryId = true;
		}
	});
</script>

<div class="px-4 pt-1 pb-4 md:p-4 md:mt-3">
	<form
		class="relative"
		method="POST"
		action={action === 'add' ? '?/add' : '?/edit'}
		use:enhance={async ({ formData }) => {
			disabled = true;

			// scalar fields are serialized from state so submission works from any step
			formData.set('productName', productName);
			formData.set('productPricePerUnit', productPricePerUnit);
			formData.set('productUnitSizeInMilliliters', productUnitSizeInMilliliters);
			formData.set('productProof', productProof);
			formData.set('categoryId', categoryId ?? '');
			formData.set('supplierId', supplierId ?? '');
			formData.set('productInStockQuantity', String(productInStockQuantity));
			formData.set('productSweetnessRating', String(productSweetnessRating));
			formData.set('productDrynessRating', String(productDrynessRating));
			formData.set('productVersatilityRating', String(productVersatilityRating));
			formData.set('productStrengthRating', String(productStrengthRating));
			formData.set('productDescription', productDescription);

			// Upload pending image if any (held in memory until now)
			if (pendingImageFile) {
				const uploadData = new FormData();
				uploadData.append('file', pendingImageFile);
				uploadData.append('kind', 'ingredients');
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
					disabled = false;
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
		{#if isShared}
			<div
				class="mb-4 rounded-lg border border-border/50 bg-muted/40 backdrop-blur-sm px-4 py-3 text-sm text-muted-foreground"
			>
				Shared Busser product — details are read-only. Manage its stock from your inventory, or
				remove it from your bar.
			</div>
		{/if}
		<FormShell
			steps={formSteps}
			bind:currentStep
			{canProceed}
			isValid={isFormValid}
			submitting={disabled}
			lastSaved={draftLastSaved}
			cancelHref="/inventory"
			eyebrow={action === 'add' ? 'New Item' : 'Edit Item'}
			submitLabel="Save Item"
		>
			{#snippet children({ step })}
				<!-- shared global products are read-only here — disable every field at once -->
				<fieldset disabled={isShared} class="contents">
					{#if step === 0}
						<!-- Basic Info Step -->
						<div class="space-y-4">
							{#if action === 'add'}
								<BottleScan onscan={handleBottleScan} categories={scanCategories} />
							{/if}
							<div>
								{#if action === 'add'}
									<!-- pick a catalog product (prompts to add it straight to stock) or type your own -->
									<SearchableSelect
										label="Name"
										fetchUrl="/api/select/products"
										placeholder="Search the catalog, or type a new name…"
										required={true}
										bind:display={productName}
										onselect={handleGlobalSelect}
									/>
								{:else}
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
								{/if}
							</div>
							<div>
								<Autocomplete
									label="Category"
									fetchUrl="/api/select/categories"
									actionUrl="/inventory/category/add"
									name="categoryId"
									grant="add_category"
									placeholder="Search categories"
									key={product?.categoryName}
									required={true}
									bind:value={categoryId}
									onselect={handleCategorySelect}
								/>
								{#if touched.categoryId && errors.categoryId}
									<Helper color="red">{errors.categoryId}</Helper>
								{/if}
							</div>
							<div>
								<SearchableSelect
									label="Supplier"
									fetchUrl="/api/select/suppliers"
									name="supplierId"
									placeholder="Any supplier"
									key={product?.supplierName ?? undefined}
									bind:value={supplierId}
								/>
							</div>
						</div>
					{:else if step === 1}
						<!-- Purchase Details Step -->
						<div class="space-y-4">
							<div>
								<Label for="productPricePerUnit" class="mb-2">
									Price <span class="text-destructive">*</span>
								</Label>
								<div class="relative">
									<span
										class="absolute left-3 top-1/2 -translate-y-1/2 z-10 font-bold text-muted-foreground pointer-events-none"
										>$</span
									>
									<Input
										type="number"
										id="productPricePerUnit"
										step="any"
										required
										class="pl-7 {touched.productPricePerUnit && errors.productPricePerUnit
											? 'border-destructive'
											: ''}"
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
										required
										class="pr-10 {touched.productUnitSizeInMilliliters &&
										errors.productUnitSizeInMilliliters
											? 'border-destructive'
											: ''}"
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
									<CalculatedBadge
										label="Price/oz"
										value={'$' + pricePerOunce()}
										icon={Calculator}
									/>
								{/if}
								{#if pricePerMl()}
									<CalculatedBadge label="Price/mL" value={'$' + pricePerMl()} icon={Calculator} />
								{/if}
								{#if abvPercent()}
									<CalculatedBadge label="ABV" value={abvPercent() ?? ''} unit="%" icon={Percent} />
								{/if}
							</div>
							<div class="flex items-center justify-end gap-3 pt-2">
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
					{:else if step === 2}
						<!-- Flavor Profile Step -->
						{#if isSpirit}
							<div class="space-y-6">
								<div class="flex justify-end">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onclick={generateFlavorRatings}
										disabled={ratingsGenerating}
									>
										{#if ratingsGenerating}
											<Loader2 class="w-4 h-4 mr-2 animate-spin" />
											Generating...
										{:else}
											<Sparkles class="w-4 h-4 mr-2" />
											Auto-Generate
										{/if}
									</Button>
								</div>
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
						{:else}
							<p class="text-sm text-muted-foreground text-center py-8">
								Flavor profile is only available for spirits.
							</p>
						{/if}
					{:else if step === 3}
						<!-- Description Step -->
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
					{/if}
				</fieldset>
			{/snippet}
		</FormShell>
	</form>

	<!-- stocks a picked catalog product against its global id, no new product row -->
	<form
		method="POST"
		action="?/add"
		bind:this={confirmForm}
		use:enhance={() => {
			return async ({ result }) => {
				confirmOpen = false;
				if (result.type === 'redirect') {
					draftManager?.clearDraft();
					$notificationStore.success = { message: 'Added to your inventory.' };
					goto(result.location);
				} else if (result.type === 'failure') {
					$notificationStore.error = {
						message: result?.data?.error?.toString() || 'Could not add product.',
					};
				}
			};
		}}
	>
		<input type="hidden" name="globalProductId" value={selectedGlobal?.value ?? ''} />
		<input type="hidden" name="productInStockQuantity" value="1" />
	</form>

	<Dialog.Root bind:open={confirmOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Add to your inventory?</Dialog.Title>
				<Dialog.Description>
					Add <span class="font-semibold">{selectedGlobal?.name}</span
					>{#if selectedGlobal?.categoryName}<span class="text-muted-foreground">
							· {selectedGlobal.categoryName}</span
						>{/if} to your bar? Its details come from the Busser catalog — you can adjust stock anytime.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (confirmOpen = false)}>Cancel</Button>
				<Button onclick={() => confirmForm?.requestSubmit()}>Add to inventory</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>

<!-- Draft Manager (only for add mode) -->
{#if action === 'add'}
	<FormDraftManager
		bind:this={draftManager}
		bind:lastSaved={draftLastSaved}
		draftKey="inventory-form"
		data={draftData}
		onrestore={handleDraftRestore}
	/>
{/if}
