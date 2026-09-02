<script lang="ts">
	import {
		ChevronLeft,
		EllipsisVertical,
		Eye,
		EyeOff,
		Heart,
		Loader2,
		Pencil,
		Plus,
		RefreshCw,
		Star,
		Trash2,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { deserialize, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import FancyButton from '$lib/components/FancyButton.svelte';
	import Recipe from '$lib/components/Recipe.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { notificationStore } from '../../../../stores';

	import type { PageData } from './$types';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';

	let { data: pageData }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';
	const authenticated = $derived(!!$page.data.user);

	// svelte-ignore state_referenced_locally
	let isFavorite = $state(pageData.isFavorite);
	// svelte-ignore state_referenced_locally
	let isFeatured = $state(pageData.isFeatured);
	// svelte-ignore state_referenced_locally
	let isPublished = $state(!!pageData.recipe.published);

	$effect(() => {
		isFavorite = pageData.isFavorite;
		isFeatured = pageData.isFeatured;
		isPublished = !!pageData.recipe.published;
	});

	const isOwned = $derived(pageData.isOwned);

	const canPublish = $derived(canModify && pageData.isGlobalCatalog);
	let publishing = $state(false);
	let customizing = $state(false);

	let sameNameConfirmOpen = $state(false);

	async function submitAdd() {
		customizing = true;
		const toastId = toast.loading('Adding to your bar…');
		const body = new FormData();
		body.set('recipeId', String(pageData.recipe.recipeId));
		body.set('sourceWorkspaceId', String(pageData.recipe.workspaceId));
		body.set('targetWorkspaceId', workspace.workspaceId);
		try {
			const res = await fetch('?/importToWorkspace', { method: 'POST', body });
			const result = deserialize(await res.text());
			const data = result.type === 'success' ? (result.data as any) : null;
			if (data && (data.success || data.alreadyImported) && data.importedRecipeId) {
				toast.success(data.alreadyImported ? 'Opening your copy' : 'Added to your bar', {
					id: toastId,
				});
				// goto(`/catalog/${data.importedRecipeId}`);
			} else {
				toast.error(data?.error || 'Could not add recipe', { id: toastId });
			}
		} catch {
			toast.error('Could not add recipe', { id: toastId });
		} finally {
			customizing = false;
		}
	}

	function attemptAdd() {
		if (pageData.ownedSameName) {
			sameNameConfirmOpen = true;
			return;
		}
		submitAdd();
	}

	// fork divergence — the source recipe has a newer version
	const sourceUpdate = $derived(pageData.sourceUpdate);
	let syncDialogOpen = $state(false);
	let syncing = $state(false);
	let updateDismissed = $state(false);

	async function doSync() {
		if (syncing) return;
		syncing = true;
		try {
			const body = new FormData();
			body.set('recipeId', String(pageData.recipe.recipeId));
			const res = await fetch('?/syncFork', { method: 'POST', body });
			const result = deserialize(await res.text());
			const data = result.type === 'success' ? (result.data as any) : null;
			if (data?.success) {
				toast.success('Recipe updated to the latest version');
				syncDialogOpen = false;
				await invalidateAll();
			} else {
				toast.error(data?.error || 'Could not update recipe');
			}
		} catch {
			toast.error('Could not update recipe');
		} finally {
			syncing = false;
		}
	}

	async function doDismiss() {
		updateDismissed = true; // optimistic
		try {
			const body = new FormData();
			body.set('recipeId', String(pageData.recipe.recipeId));
			const res = await fetch('?/dismissUpdate', { method: 'POST', body });
			const result = deserialize(await res.text());
			if (!(result.type === 'success' && (result.data as any)?.success)) {
				updateDismissed = false;
				toast.error('Could not dismiss update');
			}
		} catch {
			updateDismissed = false;
			toast.error('Could not dismiss update');
		}
	}

	async function togglePublish() {
		if (publishing) return;
		publishing = true;
		const prev = isPublished;
		isPublished = !isPublished; // optimistic
		try {
			const body = new FormData();
			body.set('recipeId', String(pageData.recipe.recipeId));
			body.set('workspaceId', pageData.recipe.workspaceId);
			const res = await fetch('?/togglePublished', { method: 'POST', body });
			const result = deserialize(await res.text());
			if (result.type === 'success' && (result.data as any)?.success) {
				await invalidateAll();
				toast.success(isPublished ? 'Recipe published' : 'Recipe moved to draft');
			} else {
				isPublished = prev;
				toast.error('Could not update publish state');
			}
		} catch {
			isPublished = prev;
			toast.error('Could not update publish state');
		} finally {
			publishing = false;
		}
	}

	const importData = $derived(pageData.importData);
	const importableWorkspaces = $derived(
		importData
			? importData.editableWorkspaces.filter(
					(ws) => !importData.importedTo.includes(ws.workspaceId)
				)
			: []
	);
	const showImport = $derived(
		authenticated && importData && importData.eligible && importableWorkspaces.length > 0
	);

	let importing = $state(new Set<string>());

	// seo stuff
	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Recipe',
		name: pageData.recipe.recipeName,
		description:
			pageData.recipe.recipeDescription || `${pageData.recipe.recipeName} cocktail recipe.`,
		...(pageData.recipe.recipeImageUrl && { image: pageData.recipe.recipeImageUrl }),
		author: { '@type': 'Organization', name: 'Busser', url: 'https://busserapp.com' },
		recipeCategory: pageData.recipe.recipeCategoryDescription,
		recipeCuisine: 'Cocktail',
		prepTime: 'PT3M',
		cookTime: 'PT2M',
		totalTime: 'PT5M',
		keywords: [
			pageData.recipe.recipeName,
			pageData.recipe.recipeCategoryDescription,
			pageData.recipe.recipeTechniqueDescriptionText,
			'cocktail',
			...pageData.recipeSteps.map((s) => s.productName),
		]
			.filter(Boolean)
			.join(', '),
		recipeIngredient: pageData.recipeSteps.map(
			(s) => `${s.productIdQuantityInMilliliters} ${s.productIdQuantityUnit} ${s.productName}`
		),
		...(pageData.recipe.recipeTechniqueDescriptionText && {
			recipeInstructions: pageData.recipe.recipeTechniqueDescriptionText,
		}),
	});

	// delete state
	let deleteModalOpen = $state(false);

	async function deleteRecipe() {
		const response = await fetch(`/api/catalog/${pageData.recipe.recipeId}`, { method: 'DELETE' });
		const result = await response.json();
		if ('data' in result) {
			$notificationStore.success = { message: 'Catalog item deleted.' };
			goto('/catalog');
		} else {
			$notificationStore.error = { message: result.error };
		}
	}
</script>

<svelte:head>
	<title>{pageData.recipe.recipeName} - Catalog</title>
	<meta
		name="description"
		content={pageData.recipe.recipeDescription ||
			`View the ${pageData.recipe.recipeName} cocktail recipe on Busser.`}
	/>
	<meta property="og:title" content="{pageData.recipe.recipeName} - Busser" />
	<meta
		property="og:description"
		content={pageData.recipe.recipeDescription ||
			`View the ${pageData.recipe.recipeName} cocktail recipe.`}
	/>
	<meta property="og:type" content="article" />
	<meta property="og:url" content="https://busserapp.com/catalog/{pageData.recipe.recipeId}" />
	{#if pageData.recipe.recipeImageUrl}
		<meta property="og:image" content={pageData.recipe.recipeImageUrl} />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{pageData.recipe.recipeName} - Busser" />
	<meta
		name="twitter:description"
		content={pageData.recipe.recipeDescription ||
			`View the ${pageData.recipe.recipeName} cocktail recipe.`}
	/>
	{#if pageData.recipe.recipeImageUrl}
		<meta name="twitter:image" content={pageData.recipe.recipeImageUrl} />
	{/if}
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</scr` + `ipt>`}
</svelte:head>

<!-- more menu -->
{#snippet moreMenuItems()}
	{#if canModify && isOwned}
		<DropdownMenu.Item onclick={() => goto(`/catalog/${pageData.recipe.recipeId}/edit`)}>
			<Pencil class="h-4 w-4 mr-2" />
			Edit Recipe
		</DropdownMenu.Item>
		{#if canPublish}
			<DropdownMenu.Item disabled={publishing} onclick={togglePublish}>
				{#if isPublished}
					<EyeOff class="h-4 w-4 mr-2" />
					Unpublish
				{:else}
					<Eye class="h-4 w-4 mr-2" />
					Publish
				{/if}
			</DropdownMenu.Item>
		{/if}
	{/if}

	<!-- a global recipe can't be edited in place — "add" forks it into this bar and lands on the copy -->
	{#if canModify && !isOwned}
		<DropdownMenu.Item
			disabled={customizing}
			closeOnSelect={false}
			class="cursor-pointer"
			onclick={attemptAdd}
		>
			{#if customizing}
				<Loader2 class="h-4 w-4 mr-2 animate-spin text-muted-foreground" />
			{:else}
				<Plus class="h-4 w-4 mr-2" />
			{/if}
			Add to workspace
		</DropdownMenu.Item>
	{/if}

	{#if showImport && importData}
		{#if canModify}
			<DropdownMenu.Separator />
		{/if}
		<DropdownMenu.Label class="text-xs text-muted-foreground">Add to workspace</DropdownMenu.Label>
		{#each importableWorkspaces as ws}
			{@const isImporting = importing.has(ws.workspaceId)}
			<form
				method="POST"
				action="?/importToWorkspace"
				use:enhance={() => {
					const toastId = toast.loading(`Importing to ${ws.workspaceName}...`);
					importing = new Set(importing).add(ws.workspaceId);
					return async ({ result }) => {
						importing = new Set([...importing].filter((id) => id !== ws.workspaceId));
						if (result.type === 'success' && result.data) {
							const data = result.data as any;
							if (data.alreadyImported) {
								toast.info(`Already imported to ${ws.workspaceName}`, { id: toastId });
							} else if (data.success) {
								toast.success(`Imported to ${ws.workspaceName}`, { id: toastId });
								invalidateAll();
							} else {
								toast.error(data.error || 'Failed to import recipe', { id: toastId });
							}
						} else {
							toast.error('Failed to import recipe', { id: toastId });
						}
					};
				}}
			>
				<input type="hidden" name="recipeId" value={pageData.recipe.recipeId} />
				<input type="hidden" name="sourceWorkspaceId" value={workspace.workspaceId} />
				<input type="hidden" name="targetWorkspaceId" value={ws.workspaceId} />
				<DropdownMenu.Item disabled={isImporting} closeOnSelect={false} class="cursor-pointer">
					<button type="submit" class="flex items-center gap-2 w-full" disabled={isImporting}>
						{#if isImporting}
							<Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
						{:else}
							<Plus class="h-4 w-4" />
						{/if}
						{ws.workspaceName}
						{#if isImporting}
							<span class="text-xs text-muted-foreground ml-auto">importing…</span>
						{/if}
					</button>
				</DropdownMenu.Item>
			</form>
		{/each}
	{/if}

	{#if canModify && isOwned}
		<DropdownMenu.Separator />
		<DropdownMenu.Item
			class="text-destructive dark:text-red-400 data-[highlighted]:text-destructive dark:data-[highlighted]:text-red-400 data-[highlighted]:bg-destructive/10"
			onclick={() => (deleteModalOpen = true)}
		>
			<Trash2 class="h-4 w-4 mr-2" />
			Delete Recipe
		</DropdownMenu.Item>
	{/if}
{/snippet}

<div class="container mx-auto max-w-6xl px-4">
	<!-- fork is behind its source — offer to pull the latest -->
	{#if canModify && sourceUpdate?.updateAvailable && !updateDismissed}
		<div
			class="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-3 backdrop-blur-md"
		>
			<div class="flex items-center gap-2 text-sm">
				<RefreshCw class="h-4 w-4 text-neon-cyan shrink-0" />
				A newer version of this recipe is available from the catalog.
			</div>
			<div class="flex gap-2 shrink-0">
				<FancyButton size="sm" variant="default" onclick={() => (syncDialogOpen = true)}>
					Update
				</FancyButton>
				<FancyButton size="sm" onclick={doDismiss}>Dismiss</FancyButton>
			</div>
		</div>
	{/if}

	<!-- Desktop toolbar above hero -->
	<div class="hidden md:flex items-center justify-between mb-4 mt-4">
		<div class="flex items-center gap-3">
			<FancyButton href="/catalog" size="sm">
				<ChevronLeft class="h-4 w-4 mr-1" />
				Back to Catalog
			</FancyButton>
			{#if canPublish && !isPublished}
				<span
					class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
				>
					Draft
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			{#if authenticated}
				<form
					method="POST"
					action="?/toggleFavorite"
					use:enhance={() => {
						isFavorite = !isFavorite;
						return async ({ result }) => {
							if (result.type === 'failure') {
								isFavorite = !isFavorite;
								invalidateAll();
							}
						};
					}}
				>
					<input type="hidden" name="recipeId" value={pageData.recipe.recipeId} />
					<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
					<FancyButton type="submit" variant={isFavorite ? 'danger' : 'default'} size="sm">
						<Heart class={cn('h-4 w-4 mr-1', isFavorite && 'fill-current')} />
						{isFavorite ? 'Favorited' : 'Favorite'}
					</FancyButton>
				</form>
			{/if}

			{#if authenticated && canModify && isOwned}
				<form
					method="POST"
					action="?/toggleFeatured"
					use:enhance={() => {
						isFeatured = !isFeatured;
						return async ({ result }) => {
							if (result.type === 'failure') {
								isFeatured = !isFeatured;
								invalidateAll();
							}
						};
					}}
				>
					<input type="hidden" name="recipeId" value={pageData.recipe.recipeId} />
					<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
					<FancyButton type="submit" variant={isFeatured ? 'warning' : 'default'} size="sm">
						<Star class={cn('h-4 w-4 mr-1', isFeatured && 'fill-current')} />
						{isFeatured ? 'Featured' : 'Feature'}
					</FancyButton>
				</form>
			{/if}

			{#if canModify || (showImport && importData)}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="glass-cta glass-cta-sm">
						<EllipsisVertical class="h-4 w-4 mr-1" />
						More
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						{@render moreMenuItems()}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>
	</div>

	<Recipe
		recipe={pageData.recipe}
		recipeSteps={pageData.recipeSteps}
		stepExtras={pageData.stepExtras}
	>
		{#snippet actions()}
			<div class="flex w-full flex-col gap-2">
				<!-- top row: back + more, matching the hero layout used across the app -->
				<div class="flex gap-2">
					<FancyButton href="/catalog" size="sm" class="flex-1 justify-center">
						<ChevronLeft class="h-4 w-4 mr-1" />
						Back
					</FancyButton>

					{#if canModify || (showImport && importData)}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger class="glass-cta glass-cta-sm shrink-0">
								<EllipsisVertical class="h-4 w-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								{@render moreMenuItems()}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{/if}
				</div>

				<!-- second row: favorite + feature -->
				{#if authenticated}
					<div class="flex gap-2">
						<form
							class="flex-1"
							method="POST"
							action="?/toggleFavorite"
							use:enhance={() => {
								isFavorite = !isFavorite;
								return async ({ result }) => {
									if (result.type === 'failure') {
										isFavorite = !isFavorite;
										invalidateAll();
									}
								};
							}}
						>
							<input type="hidden" name="recipeId" value={pageData.recipe.recipeId} />
							<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
							<FancyButton
								type="submit"
								variant={isFavorite ? 'danger' : 'default'}
								size="sm"
								class="w-full justify-center"
							>
								<Heart class={cn('h-4 w-4 mr-1', isFavorite && 'fill-current')} />
								{isFavorite ? 'Favorited' : 'Favorite'}
							</FancyButton>
						</form>

						{#if canModify && isOwned}
							<form
								class="flex-1"
								method="POST"
								action="?/toggleFeatured"
								use:enhance={() => {
									isFeatured = !isFeatured;
									return async ({ result }) => {
										if (result.type === 'failure') {
											isFeatured = !isFeatured;
											invalidateAll();
										}
									};
								}}
							>
								<input type="hidden" name="recipeId" value={pageData.recipe.recipeId} />
								<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
								<FancyButton
									type="submit"
									variant={isFeatured ? 'warning' : 'default'}
									size="sm"
									class="w-full justify-center"
								>
									<Star class={cn('h-4 w-4 mr-1', isFeatured && 'fill-current')} />
									{isFeatured ? 'Featured' : 'Feature'}
								</FancyButton>
							</form>
						{/if}
					</div>
				{/if}
			</div>
		{/snippet}
	</Recipe>
</div>

<!-- update-to-latest confirmation (replaces the fork's content) -->
<Dialog.Root bind:open={syncDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Update to latest version?</Dialog.Title>
			<Dialog.Description>
				This replaces your copy of <span class="font-semibold">{pageData.recipe.recipeName}</span> with
				the latest version from the catalog, including any customizations you've made to it.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (syncDialogOpen = false)}>Cancel</Button>
			<Button onclick={doSync} disabled={syncing}>{syncing ? 'Updating…' : 'Update'}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- delete confirmation -->
{#if canModify}
	<Dialog.Root bind:open={deleteModalOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Confirm Delete</Dialog.Title>
				<Dialog.Description>
					Delete <span class="font-semibold">{pageData.recipe.recipeName}</span> from catalog?
					<p
						class="text-destructive font-semibold mt-3 text-sm bg-destructive/10 dark:bg-destructive/15 rounded-lg px-3 py-2 border border-destructive/20"
					>
						Once deleted, it can't be recovered.
					</p>
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (deleteModalOpen = false)}>Cancel</Button>
				<Button
					variant="destructive"
					onclick={async () => {
						await deleteRecipe();
						deleteModalOpen = false;
					}}>Delete</Button
				>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<!-- soft same-name nudge before adding busser's version alongside one you already have -->
<Dialog.Root bind:open={sameNameConfirmOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add Busser's version too?</Dialog.Title>
			<Dialog.Description>
				You already have a recipe called <span class="font-semibold"
					>{pageData.recipe.recipeName}</span
				>
				in this bar. Adding Busser's version gives you a separate copy you can tweak — your existing recipe
				is untouched.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (sameNameConfirmOpen = false)}>Cancel</Button>
			<Button
				disabled={customizing}
				onclick={() => {
					sameNameConfirmOpen = false;
					submitAdd();
				}}>Add anyway</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
