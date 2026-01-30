<script lang="ts">
	import {
		ArrowRightLeft,
		Building2,
		Check,
		ChevronDown,
		Crown,
		Globe,
		Settings,
		User,
		Users,
	} from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';

	// Props
	type Props = {
		workspaces: WorkspaceWithRole[];
		currentWorkspace: WorkspaceWithRole | null;
		compact?: boolean;
	};

	let { workspaces, currentWorkspace, compact = false }: Props = $props();

	const GLOBAL_WORKSPACE_ID = 'ws-global-catalog';

	// Check if workspace is global
	function isGlobalWorkspace(workspaceId: string): boolean {
		return workspaceId === GLOBAL_WORKSPACE_ID;
	}

	// Switch to a different workspace
	function switchWorkspace(workspaceId: string) {
		// Navigate to the new workspace's catalog
		goto(`/${workspaceId}/catalog`);
	}

	// Go to workspace settings
	function goToWorkspaceSettings() {
		const from = currentWorkspace?.workspaceId || '';
		goto(`/settings/workspaces${from ? `?from=${from}` : ''}`);
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#if compact}
			<Button variant="ghost" size="icon" class="h-9 w-9">
				<Building2 class="h-5 w-5" />
				<span class="sr-only">Switch workspace</span>
			</Button>
		{:else}
			<Button variant="outline" class="gap-2 h-9">
				{#if currentWorkspace}
					{#if isGlobalWorkspace(currentWorkspace.workspaceId)}
						<Globe class="h-4 w-4 text-blue-500" />
					{:else if currentWorkspace.workspaceType === 'personal'}
						<User class="h-4 w-4 text-purple-500" />
					{:else}
						<Users class="h-4 w-4 text-green-500" />
					{/if}
					<span class="max-w-[120px] truncate">{currentWorkspace.workspaceName}</span>
				{:else}
					<Building2 class="h-4 w-4" />
					<span>Select Workspace</span>
				{/if}
				<ChevronDown class="h-4 w-4 opacity-50" />
			</Button>
		{/if}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content class="w-64" align="start">
		<DropdownMenu.Label>Workspaces</DropdownMenu.Label>
		<DropdownMenu.Separator />

		{#if workspaces.length > 0}
			<DropdownMenu.Group>
				{#each workspaces as workspace (workspace.workspaceId)}
					<DropdownMenu.Item
						class="cursor-pointer gap-2"
						onclick={() => switchWorkspace(workspace.workspaceId)}
					>
						<div class="flex items-center gap-2 flex-1 min-w-0">
							{#if isGlobalWorkspace(workspace.workspaceId)}
								<Globe class="h-4 w-4 text-blue-500 shrink-0" />
							{:else if workspace.workspaceType === 'personal'}
								<User class="h-4 w-4 text-purple-500 shrink-0" />
							{:else}
								<Users class="h-4 w-4 text-green-500 shrink-0" />
							{/if}
							<span class="truncate">{workspace.workspaceName}</span>
							{#if workspace.workspaceRole === 'owner'}
								<Crown class="h-3 w-3 text-amber-500 shrink-0" />
							{/if}
						</div>
						{#if currentWorkspace?.workspaceId === workspace.workspaceId}
							<Check class="h-4 w-4 shrink-0" />
						{/if}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		{:else}
			<div class="px-2 py-4 text-center text-sm text-muted-foreground">No workspaces available</div>
		{/if}

		<DropdownMenu.Separator />

		<DropdownMenu.Item class="cursor-pointer gap-2" onclick={goToWorkspaceSettings}>
			<Settings class="h-4 w-4" />
			Manage Workspaces
		</DropdownMenu.Item>

		<DropdownMenu.Item class="cursor-pointer gap-2" onclick={() => goto('/workspace-selector')}>
			<ArrowRightLeft class="h-4 w-4" />
			Workspace Selector
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
