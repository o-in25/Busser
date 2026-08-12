<script lang="ts">
	import { FlaskConical, GalleryHorizontalEnd, Globe, Package, Sparkles } from 'lucide-svelte';
	import { page } from '$app/stores';

	import AiAssistant from '$lib/components/AiAssistant.svelte';
	import FancyBadge from '$lib/components/FancyBadge.svelte';
	import FancyButton from '$lib/components/FancyButton.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import logo from '$lib/assets/logo.png';
	import { workspaceSwitcherOpen } from '../../../stores';

	let { data } = $props();
</script>

<svelte:head>
	<title>Busser AI - Busser</title>
</svelte:head>

{#if data.authenticated}
	<div class="flex flex-col {data.canModify ? 'h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]' : ''}">
		<!-- Hero Section -->
		<div
			class="rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-6 px-4 py-4 sm:px-6 sm:py-5"
		>
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-bold">Busser AI</h1>
			</div>
			<p class="text-sm text-muted-foreground mt-0.5 mb-3">
				Describe a cocktail and Busser AI will check your inventory, suggest ingredients, and add it
				to your catalog.
			</p>
			<div class="flex gap-2 flex-wrap">
				{#if data.workspaceName}
					<FancyBadge class="whitespace-nowrap">
						<GalleryHorizontalEnd class="h-4 w-4 text-primary shrink-0" />
						<span class="text-sm font-bold">{data.workspaceName}</span>
					</FancyBadge>
				{/if}
				<FancyBadge class="whitespace-nowrap">
					<FlaskConical class="h-4 w-4 text-primary shrink-0" />
					<span class="text-sm font-bold">{data.recipeCount}</span>
					<span class="text-xs text-muted-foreground">Recipes</span>
				</FancyBadge>
				<FancyBadge class="whitespace-nowrap">
					<Package class="h-4 w-4 text-primary shrink-0" />
					<span class="text-sm font-bold">{data.productCount}</span>
					<span class="text-xs text-muted-foreground">Products</span>
				</FancyBadge>
			</div>
		</div>

		{#if data.canModify}
			<!-- chat container -->
			<div class="glass-panel flex-1 min-h-0 overflow-hidden w-full max-w-3xl mx-auto">
				<AiAssistant userAvatarUrl={$page.data.user?.avatarImageUrl} />
			</div>
		{:else}
			<!-- switch workspace prompt -->
			<div class="glass-panel overflow-hidden flex items-center justify-center p-6 w-full max-w-3xl mx-auto">
				<div class="text-center max-w-sm space-y-6">
					<div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
						<Sparkles class="h-8 w-8 text-primary" />
					</div>
					<div>
						<h2 class="text-lg font-semibold mb-1">Switch to your workspace</h2>
						<p class="text-sm text-muted-foreground">
							Busser AI needs write access to your catalog and inventory. Switch to a workspace you own to get started.
						</p>
					</div>
					<FancyButton size="md" variant="primary" onclick={() => ($workspaceSwitcherOpen = true)}>
						<Globe class="h-4 w-4 mr-2" />
						Switch Workspace
					</FancyButton>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<Hero class="rounded-2xl mt-4" logo>
		<div class="max-w-2xl mx-auto text-center px-4 py-12 md:py-18">
			<h1
				class="text-3xl md:text-4xl font-extrabold mb-4 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 via-primary-500 to-neon-amber-500"
			>
				What Should I Make Tonight?
			</h1>
			<p class="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
				Get personalized cocktail recommendations based on what's in your bar.
			</p>
			<div class="flex flex-col sm:flex-row justify-center gap-4">
				<FancyButton variant="primary" href="/signup">Sign Up</FancyButton>
				<FancyButton href="/login">Log In</FancyButton>
			</div>
		</div>
	</Hero>
{/if}
