<script lang="ts">
	import { Check, Crown, GalleryHorizontalEnd, Globe, User, Users } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';

	const GLOBAL_WORKSPACE_ID = 'ws-global-catalog';

	let {
		workspaces,
		activeWorkspaceId = null,
		onSelect,
	}: {
		workspaces: WorkspaceWithRole[];
		activeWorkspaceId: string | null;
		onSelect: (workspaceId: string) => void;
	} = $props();

	function isGlobalWorkspace(workspaceId: string): boolean {
		return workspaceId === GLOBAL_WORKSPACE_ID;
	}
</script>

{#if workspaces.length > 0}
	<div class="space-y-2">
		{#each workspaces as workspace (workspace.workspaceId)}
			<button
				type="button"
				onclick={() => onSelect(workspace.workspaceId)}
				class="w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all {activeWorkspaceId ===
				workspace.workspaceId
					? 'border-primary bg-primary/5'
					: 'border-transparent bg-muted/30 hover:bg-muted/50'}"
			>
				<div class="flex items-center gap-3">
					<div
						class="p-2 rounded-lg {isGlobalWorkspace(workspace.workspaceId)
							? 'bg-blue-500/10'
							: workspace.workspaceType === 'personal'
								? 'bg-secondary-500/10'
								: 'bg-neon-green-500/10'}"
					>
						{#if isGlobalWorkspace(workspace.workspaceId)}
							<Globe class="h-4 w-4 text-blue-500" />
						{:else if workspace.workspaceType === 'personal'}
							<User class="h-4 w-4 text-secondary-500" />
						{:else}
							<Users class="h-4 w-4 text-neon-green-500" />
						{/if}
					</div>
					<div class="text-left">
						<div class="font-medium text-sm flex items-center gap-2">
							{workspace.workspaceName}
							{#if isGlobalWorkspace(workspace.workspaceId)}
								<Badge variant="outline" class="text-xs">Global</Badge>
							{/if}
						</div>
						<div class="text-xs text-muted-foreground capitalize">
							{workspace.workspaceType} workspace
						</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="capitalize text-xs">
						{#if workspace.workspaceRole === 'owner'}
							<Crown class="h-3 w-3 mr-1" />
						{/if}
						{workspace.workspaceRole}
					</Badge>
					{#if activeWorkspaceId === workspace.workspaceId}
						<div class="w-2 h-2 rounded-full bg-primary"></div>
					{/if}
				</div>
			</button>
		{/each}
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-8 text-center">
		<div class="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
			<GalleryHorizontalEnd class="h-6 w-6 text-muted-foreground/50" />
		</div>
		<h3 class="font-semibold mb-1">No Workspaces Available</h3>
		<p class="text-muted-foreground text-sm">
			You don't have access to any workspaces yet.
		</p>
	</div>
{/if}
