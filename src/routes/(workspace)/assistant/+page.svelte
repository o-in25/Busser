<script lang="ts">
	import { ShieldAlert, Sparkles } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';

	import AiAssistant from '$lib/components/AiAssistant.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	let switching = $state(false);

	async function switchWorkspace(workspaceId: string) {
		switching = true;
		try {
			const res = await fetch('/api/workspace/switch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ workspaceId }),
			});

			if (res.ok) {
				await invalidateAll();
			}
		} finally {
			switching = false;
		}
	}
</script>

<svelte:head>
	<title>Busser AI - Busser</title>
</svelte:head>

<div class="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] max-w-3xl mx-auto">
	<!-- hero -->
	<div
		class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-secondary/5 border border-primary/10 mb-4 mt-2"
	>
		<div class="relative px-5 py-5 flex items-center gap-4">
			<div
				class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0"
			>
				<Sparkles class="h-5 w-5 text-white" />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h1 class="text-xl font-bold">Busser AI</h1>
					<Badge
						variant="secondary"
						class="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5">Beta</Badge
					>
				</div>
				<p class="text-sm text-muted-foreground mt-0.5">
					Describe a cocktail and Busser AI will check your inventory, suggest ingredients, and add
					it to your catalog.
				</p>
			</div>
		</div>
	</div>

	{#if data.canModify}
		<!-- chat container -->
		<div class="glass-panel flex-1 min-h-0 overflow-hidden">
			<AiAssistant userAvatarUrl={$page.data.user?.avatarImageUrl} />
		</div>
	{:else}
		<!-- permission gate -->
		<div class="glass-panel flex-1 min-h-0 overflow-hidden flex items-center justify-center p-6">
			<div class="text-center max-w-md space-y-4">
				<div
					class="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto"
				>
					<ShieldAlert class="h-7 w-7 text-destructive" />
				</div>

				<div>
					<h2 class="text-lg font-semibold">View-only access</h2>
					<p class="text-sm text-muted-foreground mt-1">
						You need editor or owner access to use the AI assistant in this workspace. The assistant
						modifies your catalog and inventory, which requires write permissions.
					</p>
				</div>

				{#if data.editableWorkspaces.length > 0}
					<div class="pt-2 space-y-2">
						<p class="text-sm font-medium">Switch to a workspace you can edit:</p>
						<div class="flex flex-col gap-2">
							{#each data.editableWorkspaces as ws}
								<Button
									variant="outline"
									class="w-full justify-start"
									disabled={switching}
									onclick={() => switchWorkspace(ws.workspaceId)}
								>
									{ws.workspaceName}
								</Button>
							{/each}
						</div>
						<p class="text-xs text-muted-foreground mt-2">
							This will switch your active workspace for this session only.
						</p>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">
						You don't have editor or owner access to any workspace. Ask a workspace owner to upgrade
						your role.
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
