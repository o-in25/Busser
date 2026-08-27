<script lang="ts">
	import { Sparkles } from 'lucide-svelte';
	import { page } from '$app/stores';

	import AiAssistant from '$lib/components/AiAssistant.svelte';
	import WorkspaceSwitcherBadge from '$lib/components/WorkspaceSwitcherBadge.svelte';
	import { Badge } from '$lib/components/ui/badge';

	let { data } = $props();
</script>

<svelte:head>
	<title>Assistant - Busser</title>
</svelte:head>

<div class="flex flex-col {data.canModify ? 'h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]' : ''}">
	<!-- Hero Section -->
	<div
		class="rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-6 px-4 py-4 sm:px-6 sm:py-5"
	>
		<div class="flex items-center gap-2">
			<h1 class="text-2xl font-bold">Assistant</h1>
			<Badge
				variant="secondary"
				class="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0">Beta</Badge
			>
		</div>
		<p class="text-sm text-muted-foreground mt-0.5 mb-3">
			Describe a cocktail and Assistant will check your inventory, suggest ingredients, and add it
			to your catalog.
		</p>
		<div class="flex gap-2 flex-wrap">
			<WorkspaceSwitcherBadge variant="pill" workspaceName={data.workspaceName} />
		</div>
	</div>

	{#if data.canModify}
		<!-- chat container — full width to match the hero -->
		<div class="glass-panel flex-1 min-h-0 overflow-hidden w-full">
			<AiAssistant userAvatarUrl={$page.data.user?.avatarImageUrl} />
		</div>
	{:else}
		<!-- switch workspace prompt -->
		<div
			class="glass-panel overflow-hidden flex items-center justify-center p-6 w-full max-w-3xl mx-auto"
		>
			<div class="text-center max-w-sm space-y-6">
				<div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
					<Sparkles class="h-8 w-8 text-primary" />
				</div>
				<div>
					<h2 class="text-lg font-semibold mb-1">Switch to your workspace</h2>
					<p class="text-sm text-muted-foreground">
						Assistant needs write access to your catalog and inventory. Use the workspace switcher
						above to switch to a workspace you own and get started.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
