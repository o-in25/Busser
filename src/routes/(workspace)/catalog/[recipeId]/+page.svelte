<script lang="ts">
	import { ChevronLeft, EllipsisVertical, Heart, Pencil, Plus, Star, Check, Trash2, Download } from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { enhance } from '$app/forms';
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

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';
	const authenticated = $derived(!!$page.data.user);

	// local state for optimistic updates
	let isFavorite = $state(data.isFavorite);
	let isFeatured = $state(data.isFeatured);
	let importingTo = $state<string | null>(null);

	$effect(() => {
		isFavorite = data.isFavorite;
		isFeatured = data.isFeatured;
	});

	// import helpers
	const importData = $derived(data.importData);
	const showImport = $derived(
		authenticated && importData && importData.eligible && importData.editableWorkspaces.length > 0
	);
	const singleWorkspace = $derived(
		importData?.editableWorkspaces.length === 1 ? importData.editableWorkspaces[0] : null
	);

	// json-ld structured data for search engines
	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Recipe',
		name: data.recipe.recipeName,
		description: data.recipe.recipeDescription || `${data.recipe.recipeName} cocktail recipe.`,
		...(data.recipe.recipeImageUrl && { image: data.recipe.recipeImageUrl }),
		recipeCategory: data.recipe.recipeCategoryDescription,
		recipeIngredient: data.recipeSteps.map(
			(s) => `${s.productIdQuantityInMilliliters} ${s.productIdQuantityUnit} ${s.productName}`
		),
		...(data.recipe.recipeTechniqueDescriptionText && {
			recipeInstructions: data.recipe.recipeTechniqueDescriptionText,
		}),
	});

	// delete state
	let deleteModalOpen = $state(false);

	async function deleteRecipe() {
		const response = await fetch(`/api/catalog/${data.recipe.recipeId}`, { method: 'DELETE' });
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
	<title>{data.recipe.recipeName} - Catalog</title>
	<meta name="description" content={data.recipe.recipeDescription || `View the ${data.recipe.recipeName} cocktail recipe on Busser.`} />
	<meta property="og:title" content="{data.recipe.recipeName} - Busser" />
	<meta property="og:description" content={data.recipe.recipeDescription || `View the ${data.recipe.recipeName} cocktail recipe.`} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="https://busserapp.com/catalog/{data.recipe.recipeId}" />
	{#if data.recipe.recipeImageUrl}
		<meta property="og:image" content={data.recipe.recipeImageUrl} />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{data.recipe.recipeName} - Busser" />
	<meta name="twitter:description" content={data.recipe.recipeDescription || `View the ${data.recipe.recipeName} cocktail recipe.`} />
	{#if data.recipe.recipeImageUrl}
		<meta name="twitter:image" content={data.recipe.recipeImageUrl} />
	{/if}
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<div class="container mx-auto max-w-6xl px-4">
	<!-- Desktop toolbar above hero -->
	<div class="hidden md:flex items-center justify-between mb-4 mt-4">
		<FancyButton href="/catalog/browse" size="sm">
			<ChevronLeft class="h-4 w-4 mr-1" />
			Back to Catalog
		</FancyButton>

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
					<input type="hidden" name="recipeId" value={data.recipe.recipeId} />
					<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
					<FancyButton type="submit" variant={isFavorite ? 'danger' : 'default'} size="sm">
						<Heart class={cn('h-4 w-4 mr-1', isFavorite && 'fill-current')} />
						{isFavorite ? 'Favorited' : 'Favorite'}
					</FancyButton>
				</form>
			{/if}

			{#if authenticated && canModify}
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
					<input type="hidden" name="recipeId" value={data.recipe.recipeId} />
					<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
					<FancyButton type="submit" variant={isFeatured ? 'warning' : 'default'} size="sm">
						<Star class={cn('h-4 w-4 mr-1', isFeatured && 'fill-current')} />
						{isFeatured ? 'Featured' : 'Feature'}
					</FancyButton>
				</form>
			{/if}

			{#if canModify}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="glass-cta glass-cta-sm">
						<EllipsisVertical class="h-4 w-4 mr-1" />
						More
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item onclick={() => goto(`/catalog/${data.recipe.recipeId}/edit`)}>
							<Pencil class="h-4 w-4 mr-2" />
							Edit Recipe
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							class="text-destructive data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10"
							onclick={() => (deleteModalOpen = true)}
						>
							<Trash2 class="h-4 w-4 mr-2" />
							Delete Recipe
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}

			{#if showImport}
				{#if singleWorkspace}
					{@const alreadyImported = importData?.importedTo.includes(singleWorkspace.workspaceId)}
					<form
						method="POST"
						action="?/importToWorkspace"
						use:enhance={() => {
							importingTo = singleWorkspace.workspaceId;
							return async ({ result }) => {
								importingTo = null;
								if (result.type === 'success' && result.data) {
									const d = result.data as any;
									if (d.alreadyImported) {
										toast.info('Already imported to your workspace');
									} else if (d.success) {
										toast.success(`Imported to ${singleWorkspace.workspaceName}`);
										invalidateAll();
									}
								} else {
									toast.error('Failed to import recipe');
								}
							};
						}}
					>
						<input type="hidden" name="recipeId" value={data.recipe.recipeId} />
						<input type="hidden" name="sourceWorkspaceId" value={workspace.workspaceId} />
						<input type="hidden" name="targetWorkspaceId" value={singleWorkspace.workspaceId} />
						<FancyButton type="submit" variant={alreadyImported ? 'default' : 'primary'} size="sm" disabled={!!alreadyImported || !!importingTo}>
							{#if alreadyImported}
								<Check class="h-4 w-4 mr-1" />
								Imported
							{:else}
								<Plus class="h-4 w-4 mr-1" />
								Add to Workspace
							{/if}
						</FancyButton>
					</form>
				{:else if importData}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="glass-cta glass-cta-primary glass-cta-sm">
							<Plus class="h-4 w-4 mr-1" />
							Import
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							{#each importData.editableWorkspaces as ws}
								{@const alreadyImported = importData.importedTo.includes(ws.workspaceId)}
								<form
									method="POST"
									action="?/importToWorkspace"
									use:enhance={() => {
										importingTo = ws.workspaceId;
										return async ({ result }) => {
											importingTo = null;
											if (result.type === 'success' && result.data) {
												const d = result.data as any;
												if (d.alreadyImported) {
													toast.info(`Already imported to ${ws.workspaceName}`);
												} else if (d.success) {
													toast.success(`Imported to ${ws.workspaceName}`);
													invalidateAll();
												}
											} else {
												toast.error('Failed to import recipe');
											}
										};
									}}
								>
									<input type="hidden" name="recipeId" value={data.recipe.recipeId} />
									<input type="hidden" name="sourceWorkspaceId" value={workspace.workspaceId} />
									<input type="hidden" name="targetWorkspaceId" value={ws.workspaceId} />
									<DropdownMenu.Item disabled={alreadyImported || importingTo === ws.workspaceId} class="cursor-pointer">
										<button type="submit" class="flex items-center gap-2 w-full" disabled={alreadyImported}>
											{#if alreadyImported}
												<Check class="h-4 w-4 text-muted-foreground" />
											{:else}
												<Download class="h-4 w-4" />
											{/if}
											{ws.workspaceName}
											{#if alreadyImported}
												<span class="text-xs text-muted-foreground ml-auto">imported</span>
											{/if}
										</button>
									</DropdownMenu.Item>
								</form>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
			{/if}
		</div>
	</div>

	<Recipe recipe={data.recipe} recipeSteps={data.recipeSteps}>
		{#snippet actions()}
			{#if authenticated && canModify}
				<div class="grid grid-cols-2 gap-2 w-full">
					<FancyButton href="/catalog/browse" size="sm" class="w-full justify-center">
						<ChevronLeft class="h-4 w-4 mr-1" />
						Back
					</FancyButton>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="glass-cta glass-cta-sm w-full justify-center">
							<EllipsisVertical class="h-4 w-4 mr-1" />
							More
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Item onclick={() => goto(`/catalog/${data.recipe.recipeId}/edit`)}>
								<Pencil class="h-4 w-4 mr-2" />
								Edit Recipe
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								class="text-destructive data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10"
								onclick={() => (deleteModalOpen = true)}
							>
								<Trash2 class="h-4 w-4 mr-2" />
								Delete Recipe
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<form class="contents" method="POST" action="?/toggleFavorite"
						use:enhance={() => { isFavorite = !isFavorite; return async ({ result }) => { if (result.type === 'failure') { isFavorite = !isFavorite; invalidateAll(); } }; }}
					>
						<input type="hidden" name="recipeId" value={data.recipe.recipeId} />
						<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
						<FancyButton type="submit" variant={isFavorite ? 'danger' : 'default'} size="sm" class="w-full justify-center">
							<Heart class={cn('h-4 w-4 mr-1', isFavorite && 'fill-current')} />
							{isFavorite ? 'Favorited' : 'Favorite'}
						</FancyButton>
					</form>

					<form class="contents" method="POST" action="?/toggleFeatured"
						use:enhance={() => { isFeatured = !isFeatured; return async ({ result }) => { if (result.type === 'failure') { isFeatured = !isFeatured; invalidateAll(); } }; }}
					>
						<input type="hidden" name="recipeId" value={data.recipe.recipeId} />
						<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
						<FancyButton type="submit" variant={isFeatured ? 'warning' : 'default'} size="sm" class="w-full justify-center">
							<Star class={cn('h-4 w-4 mr-1', isFeatured && 'fill-current')} />
							{isFeatured ? 'Featured' : 'Feature'}
						</FancyButton>
					</form>
				</div>
			{:else}
				<div class="flex gap-2 w-full">
					<FancyButton href="/catalog/browse" size="sm" class="flex-1 justify-center">
						<ChevronLeft class="h-4 w-4 mr-1" />
						Back
					</FancyButton>
					{#if authenticated}
						<form class="flex-1" method="POST" action="?/toggleFavorite"
							use:enhance={() => { isFavorite = !isFavorite; return async ({ result }) => { if (result.type === 'failure') { isFavorite = !isFavorite; invalidateAll(); } }; }}
						>
							<input type="hidden" name="recipeId" value={data.recipe.recipeId} />
							<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
							<FancyButton type="submit" variant={isFavorite ? 'danger' : 'default'} size="sm" class="w-full justify-center">
								<Heart class={cn('h-4 w-4 mr-1', isFavorite && 'fill-current')} />
								{isFavorite ? 'Favorited' : 'Favorite'}
							</FancyButton>
						</form>
					{/if}
				</div>
			{/if}
		{/snippet}
	</Recipe>
</div>

<!-- delete confirmation -->
{#if canModify}
	<Dialog.Root bind:open={deleteModalOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Confirm Delete</Dialog.Title>
				<Dialog.Description>
					Delete <span class="font-semibold">{data.recipe.recipeName}</span> from catalog?
					<p class="text-destructive font-semibold mt-3 text-sm bg-destructive/10 dark:bg-destructive/15 rounded-lg px-3 py-2 border border-destructive/20">
						Once deleted, it can't be recovered.
					</p>
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (deleteModalOpen = false)}>Cancel</Button>
				<Button variant="destructive" onclick={async () => { await deleteRecipe(); deleteModalOpen = false; }}>Delete</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
