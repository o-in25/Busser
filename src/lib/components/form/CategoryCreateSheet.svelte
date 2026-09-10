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

	// snappy nested category creation, launched from a product sheet's category field
	let {
		prefillName = '',
		oncreated,
		oncancel,
	}: {
		prefillName?: string;
		oncreated: (opt: SelectOption) => void;
		oncancel: () => void;
	} = $props();

	let categoryName = $state(prefillName);
	let parentCategoryId = $state<string | null>(null);
	let description = $state('');
	let submitting = $state(false);
	let errorMsg = $state('');

	const valid = $derived(!!categoryName.trim());

	async function save() {
		if (!valid || submitting) return;
		submitting = true;
		errorMsg = '';
		try {
			const res = await fetch('/api/inventory/category', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					categoryName: categoryName.trim(),
					parentCategoryId,
					categoryDescription: description,
				}),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				errorMsg = data?.message || 'Could not create category.';
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
		<Sheet.Title>New Category</Sheet.Title>
		<Sheet.Description>Group ingredients so recipes can match flexibly.</Sheet.Description>
	</Sheet.Header>

	<div class="flex-1 space-y-5 overflow-y-auto py-5">
		<div>
			<Label class="mb-2 block">Name <span class="text-destructive">*</span></Label>
			<Input bind:value={categoryName} placeholder="e.g., Cordials" />
		</div>

		<SearchableSelect
			label="Parent category"
			fetchUrl="/api/select/categories"
			bind:value={parentCategoryId}
			placeholder="Optional — search categories…"
		/>

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
			Add Category
		</Button>
	</Sheet.Footer>
</div>
