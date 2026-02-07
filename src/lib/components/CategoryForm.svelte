<script lang="ts">
	import { GitBranch, Tags } from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { ComponentAction, Table } from '$lib/types';

	import { notificationStore } from '../../stores';
	import Prompt from './Prompt.svelte';

	let {
		action = 'add',
		category = {} as Table.Category,
		parentCategories = [],
		productCount = 0,
	}: {
		action?: ComponentAction;
		category?: Table.Category;
		parentCategories?: Table.Category[];
		productCount?: number;
	} = $props();

	// get workspace role for permission checks
	const workspace = getContext<{ workspaceRole?: string }>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// Form state
	let categoryName = $state(category.categoryName ?? '');
	let categoryDescription = $state(category.categoryDescription ?? '');
	let parentCategoryId = $state<string>(
		category.parentCategoryId ? String(category.parentCategoryId) : ''
	);
	let isSubmitting = $state(false);
	let modalOpen = $state(false);

	// Validation state
	let touched = $state({ categoryName: false });
	const errors = $derived({
		categoryName: !categoryName.trim() ? 'Category name is required' : '',
	});
	const isValid = $derived(!errors.categoryName);

	// Get display name for selected parent
	const selectedParentLabel = $derived(() => {
		if (!parentCategoryId) return 'None (top-level category)';
		const parent = parentCategories.find((c) => c.categoryId === Number(parentCategoryId));
		return parent?.categoryName || 'None';
	});

	// Delete handler
	const deleteCategory = async () => {
		if (!category.categoryId) return;

		const formData = new FormData();
		formData.append('categoryId', String(category.categoryId));

		const response = await fetch('/inventory/category?/delete', {
			method: 'POST',
			body: formData,
		});

		const result = await response.json();
		if (result.type === 'success') {
			$notificationStore.success = { message: 'Category deleted.' };
			goto('/inventory/category');
		} else {
			$notificationStore.error = { message: result.data?.error || 'Failed to delete category.' };
		}
	};
</script>

<div class="px-4 py-4 mt-3">
	<form
		class="relative space-y-6"
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result }) => {
				isSubmitting = false;
				if (result.type === 'redirect') {
					goto(result.location);
				} else {
					await applyAction(result);
					if (result.type === 'failure') {
						$notificationStore.error = {
							message: result?.data?.error?.toString() || 'An error occurred.',
						};
					}
					if (result.type === 'success') {
						$notificationStore.success = {
							message: action === 'add' ? 'Category created.' : 'Category updated.',
						};
					}
				}
			};
		}}
	>
		<!-- Category Details Card -->
		<Card.Root>
			<Card.Header class="pb-4">
				<Card.Title class="flex items-center gap-2 text-lg">
					<Tags class="h-5 w-5 text-primary" />
					Category Details
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div>
					<Label for="categoryName" class="mb-2">
						Name <span class="text-destructive">*</span>
					</Label>
					<Input
						type="text"
						id="categoryName"
						name="categoryName"
						placeholder="e.g., Bourbon, Vodka, Bitters"
						required
						bind:value={categoryName}
						onblur={() => (touched.categoryName = true)}
						class={touched.categoryName && errors.categoryName ? 'border-destructive' : ''}
					/>
					{#if touched.categoryName && errors.categoryName}
						<Helper color="red">{errors.categoryName}</Helper>
					{/if}
				</div>

				<!-- Parent Category Selector -->
				{#if parentCategories.length > 0}
					<div>
						<Label for="parentCategoryId" class="mb-2 flex items-center gap-1.5">
							<GitBranch class="h-4 w-4" />
							Parent Category
						</Label>
						<p class="text-xs text-muted-foreground mb-2">
							Link this category to a parent (e.g., "White Rum" → "Rum")
						</p>
						<input type="hidden" name="parentCategoryId" value={parentCategoryId} />
						<Select.Root type="single" bind:value={parentCategoryId}>
							<Select.Trigger class="w-full">
								{selectedParentLabel()}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="" label="None (top-level category)" />
								{#each parentCategories as parent}
									<Select.Item value={String(parent.categoryId)} label={parent.categoryName} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				<div>
					<Prompt
						bind:value={categoryDescription}
						trigger={categoryName}
						id="categoryDescription"
						name="categoryDescription"
						url="/api/generator/category"
					/>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Action buttons -->
		<div class="flex justify-end gap-3">
			{#if action === 'edit' && canModify}
				<div class="hidden md:flex flex-col items-start gap-1">
					<Button
						type="button"
						variant="destructive"
						onclick={() => (modalOpen = true)}
						disabled={productCount > 0}
					>
						Delete
					</Button>
					{#if productCount > 0}
						<span class="text-xs text-muted-foreground">
							Remove {productCount} product{productCount !== 1 ? 's' : ''} first
						</span>
					{/if}
				</div>
			{/if}
			<Button type="submit" disabled={isSubmitting || !isValid}>
				{isSubmitting ? 'Saving...' : action === 'add' ? 'Create Category' : 'Save Changes'}
			</Button>
		</div>

		<!-- Mobile delete section -->
		{#if action === 'edit' && canModify}
			<div class="md:hidden mt-6 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
				<p class="text-sm text-muted-foreground mb-3">Danger Zone</p>
				<Button
					type="button"
					variant="destructive"
					class="w-full"
					onclick={() => (modalOpen = true)}
					disabled={productCount > 0}
				>
					Delete Category
				</Button>
				{#if productCount > 0}
					<p class="text-xs text-muted-foreground mt-2 text-center">
						Remove {productCount} product{productCount !== 1 ? 's' : ''} first
					</p>
				{/if}
			</div>
		{/if}
	</form>

	<!-- Delete confirmation dialog -->
	{#if action === 'edit' && category.categoryId}
		<Dialog.Root bind:open={modalOpen}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Confirm Delete</Dialog.Title>
					<Dialog.Description>
						Delete <span class="font-semibold">{category.categoryName}</span>?
						<p class="text-destructive font-bold mt-2">Once deleted, it can't be recovered.</p>
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (modalOpen = false)}>Cancel</Button>
					<Button
						variant="destructive"
						onclick={async () => {
							await deleteCategory();
							modalOpen = false;
						}}
					>
						Delete
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>
