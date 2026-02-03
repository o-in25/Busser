<script lang="ts">
	import { Heart, Star } from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import BackButton from '$lib/components/BackButton.svelte';
	import Recipe from '$lib/components/Recipe.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// Local state for optimistic updates
	let isFavorite = $state(data.isFavorite);
	let isFeatured = $state(data.isFeatured);
</script>

<svelte:head>
	<title>{data.recipe.recipeName} - Catalog</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4">
	<!-- Back navigation + action buttons -->
	<div class="mb-4 mt-4 flex items-center justify-between">
		<BackButton fallback="/catalog" label="Back to Catalog" size="sm" />

		<div class="flex items-center gap-2">
			<!-- Favorite button -->
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
					class={cn(isFavorite && 'bg-red-500 hover:bg-red-600 border-red-500')}
				>
					<Heart class={cn('h-4 w-4 mr-2', isFavorite && 'fill-current')} />
					{isFavorite ? 'Favorited' : 'Favorite'}
				</Button>
			</form>

			<!-- Featured button (only for editors/owners) -->
			{#if canModify}
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
						class={cn(isFeatured && 'bg-yellow-500 hover:bg-yellow-600 border-yellow-500 text-black')}
					>
						<Star class={cn('h-4 w-4 mr-2', isFeatured && 'fill-current')} />
						{isFeatured ? 'Featured' : 'Feature'}
					</Button>
				</form>
			{/if}
		</div>
	</div>

	<Recipe recipe={data.recipe} recipeSteps={data.recipeSteps} />
</div>
