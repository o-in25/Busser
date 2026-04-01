<script lang="ts">
	import { Heart, Plus, Star, Check } from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import BackButton from '$lib/components/BackButton.svelte';
	import Recipe from '$lib/components/Recipe.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';

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
	<!-- back navigation + action buttons -->
	<div class="mb-4 mt-4 flex items-center justify-between">
		<BackButton
			href="/catalog/browse"
			label="Back to Catalog"
			size="sm"
			class="max-sm:[&>span]:hidden max-sm:gap-0"
		/>

		<div class="flex items-center gap-2">
			<!-- import button -->
			{#if showImport}
				{#if singleWorkspace}
					{@const alreadyImported = importData?.importedTo.includes(singleWorkspace.workspaceId)}
					{@const nameCollision = importData?.nameCollisions.includes(singleWorkspace.workspaceId)}
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
						<Button
							type="submit"
							variant={alreadyImported ? 'outline' : 'default'}
							size="sm"
							disabled={!!alreadyImported || !!importingTo}
							class="max-sm:h-10 max-sm:px-3"
						>
							{#if alreadyImported}
								<Check class="h-4 w-4 sm:mr-2" />
								<span class="hidden sm:inline">Already Imported</span>
							{:else}
								<Plus class="h-4 w-4 sm:mr-2" />
								<span class="hidden sm:inline">Add to Workspace</span>
							{/if}
						</Button>
						{#if nameCollision && !alreadyImported}
							<p class="text-xs text-muted-foreground mt-1">You already have a recipe called "{data.recipe.recipeName}"</p>
						{/if}
					</form>
				{:else if importData}
					<!-- multiple workspaces: dropdown -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button variant="default" size="sm" class="max-sm:h-10 max-sm:px-3">
								<Plus class="h-4 w-4 sm:mr-2" />
								<span class="hidden sm:inline">Add to Workspace</span>
							</Button>
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
									<DropdownMenu.Item
										disabled={alreadyImported || importingTo === ws.workspaceId}
										class="cursor-pointer"
									>
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

			{#if authenticated}
			<!-- favorite button -->
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
				<Button
					type="submit"
					variant={isFavorite ? 'default' : 'outline'}
					size="sm"
					class={cn('max-sm:h-10 max-sm:w-10 max-sm:px-0', isFavorite && 'bg-red-500 hover:bg-red-600 border-red-500 dark:shadow-glow-pink')}
				>
					<Heart class={cn('h-5 w-5 sm:h-4 sm:w-4 sm:mr-2', isFavorite && 'fill-current')} />
					<span class="hidden sm:inline">{isFavorite ? 'Favorited' : 'Favorite'}</span>
				</Button>
			</form>

			<!-- featured button (only for editors/owners) -->
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
					<Button
						type="submit"
						variant={isFeatured ? 'default' : 'outline'}
						size="sm"
						class={cn(
							'max-sm:h-10 max-sm:w-10 max-sm:px-0',
							isFeatured && 'bg-neon-yellow-500 hover:bg-neon-yellow-600 border-neon-yellow-500 text-black dark:shadow-glow-yellow'
						)}
					>
						<Star class={cn('h-5 w-5 sm:h-4 sm:w-4 sm:mr-2', isFeatured && 'fill-current')} />
						<span class="hidden sm:inline">{isFeatured ? 'Featured' : 'Feature'}</span>
					</Button>
				</form>
			{/if}
			{/if}
		</div>
	</div>

	<Recipe recipe={data.recipe} recipeSteps={data.recipeSteps} />
</div>
