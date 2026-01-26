<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { ComponentAction, Table } from '$lib/types';
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { notificationStore } from '../../stores';
	import { getContext } from 'svelte';
	import Prompt from './Prompt.svelte';
	import { Tags } from 'lucide-svelte';

	let {
		action = 'add',
		category = {} as Table.Category
	}: {
		action?: ComponentAction;
		category?: Table.Category;
	} = $props();

	// get workspace role for permission checks
	const workspace = getContext<{ workspaceRole?: string }>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// Form state
	let categoryName = $state(category.categoryName ?? '');
	let categoryDescription = $state(category.categoryDescription ?? '');
	let isSubmitting = $state(false);
	let modalOpen = $state(false);

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
							message: action === 'add' ? 'Category created.' : 'Category updated.'
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
					<Label for="categoryName" class="mb-2">Name</Label>
					<Input
						type="text"
						id="categoryName"
						name="categoryName"
						placeholder="e.g., Bourbon, Vodka, Bitters"
						required
						bind:value={categoryName}
					/>
				</div>

				<div>
					<Prompt
						bind:value={categoryDescription}
						trigger={categoryName}
						id="categoryDescription"
						name="categoryDescription"
						url="/api/generator/inventory"
					/>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Action buttons -->
		<div class="flex justify-end gap-3">
			{#if action === 'edit' && canModify}
				<Button
					type="button"
					variant="destructive"
					onclick={() => (modalOpen = true)}
				>
					Delete
				</Button>
			{/if}
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Saving...' : (action === 'add' ? 'Create Category' : 'Save Changes')}
			</Button>
		</div>
	</form>

	<!-- Delete confirmation dialog -->
	{#if action === 'edit' && category.categoryId}
		<Dialog.Root bind:open={modalOpen}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Confirm Delete</Dialog.Title>
					<Dialog.Description>
						Delete <span class="font-semibold">{category.categoryName}</span>?
						<p class="text-destructive font-bold mt-2">
							This action cannot be undone.
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
