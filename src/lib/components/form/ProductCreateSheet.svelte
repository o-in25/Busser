<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { SelectOption } from '$lib/types';

	import SearchableSelect from './SearchableSelect.svelte';
	import SegmentedNumberInput from './SegmentedNumberInput.svelte';

	// snappy nested product creation — image skipped on purpose, category "+" stacks a category sheet
	let {
		prefillName = '',
		oncreated,
		oncancel,
	}: {
		prefillName?: string;
		oncreated: (opt: SelectOption) => void;
		oncancel: () => void;
	} = $props();

	let productName = $state(prefillName);
	let categoryId = $state<string | null>(null);
	let proof = $state(0);
	let unitSize = $state(750);
	let price = $state(0);
	let description = $state('');
	let submitting = $state(false);
	let errorMsg = $state('');

	const valid = $derived(!!productName.trim() && !!categoryId);

	async function save() {
		if (!valid || submitting) return;
		submitting = true;
		errorMsg = '';
		try {
			const res = await fetch('/api/inventory', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productName: productName.trim(),
					categoryId,
					productProof: proof,
					productUnitSizeInMilliliters: unitSize,
					productPricePerUnit: price,
					productDescription: description,
				}),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				errorMsg = data?.message || 'Could not create product.';
				return;
			}
			oncreated((await res.json()) as SelectOption);
		} catch {
			errorMsg = 'Something went wrong. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<Sheet.Header>
		<Sheet.Title>New Product</Sheet.Title>
	</Sheet.Header>

	<div class="flex-1 space-y-5 overflow-y-auto py-5">
		<div>
			<Label class="mb-2 block">Name <span class="text-destructive">*</span></Label>
			<Input bind:value={productName} placeholder="e.g., Lime Cordial" />
		</div>

		<SearchableSelect
			label="Category"
			fetchUrl="/api/select/categories"
			bind:value={categoryId}
			placeholder="Search categories…"
			required
			grant="add_category"
			createKind="category"
		/>

		<div class="grid grid-cols-2 gap-3">
			<div>
				<Label class="mb-2 block">Proof</Label>
				<SegmentedNumberInput bind:value={proof} min={0} max={200} step={1} />
			</div>
			<div>
				<Label class="mb-2 block">Price</Label>
				<SegmentedNumberInput bind:value={price} unit="$" min={0} step={1} />
			</div>
		</div>

		<div>
			<Label class="mb-2 block">Size</Label>
			<SegmentedNumberInput
				bind:value={unitSize}
				unit="ml"
				min={0}
				step={50}
				presets={[
					{ label: '375', value: 375 },
					{ label: '500', value: 500 },
					{ label: '750', value: 750 },
					{ label: '1000', value: 1000 },
				]}
			/>
		</div>

		<div>
			<Label class="mb-2 block">Notes</Label>
			<Textarea
				bind:value={description}
				rows={2}
				placeholder="Optional description…"
				class="resize-none"
			/>
		</div>

		{#if errorMsg}
			<Helper color="red">{errorMsg}</Helper>
		{/if}
	</div>

	<Sheet.Footer class="flex-row gap-3">
		<Button type="button" variant="outline" class="flex-1 rounded-full" onclick={oncancel}>
			Cancel
		</Button>
		<Button
			variant="primary"
			type="button"
			class="flex-1 rounded-full"
			disabled={!valid || submitting}
			onclick={save}
		>
			{#if submitting}<Loader2 class="mr-2 h-4 w-4 animate-spin" />{/if}
			Add Product
		</Button>
	</Sheet.Footer>
</div>
