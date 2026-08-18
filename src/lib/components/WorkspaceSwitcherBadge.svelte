<script lang="ts">
	import { Check, ChevronDown, GalleryHorizontalEnd, Globe, User as UserIcon, Users } from 'lucide-svelte';

	import { page } from '$app/stores';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';
	import { switchWorkspace } from '$lib/utils/workspace';
	import { workspaceSwitching } from '../../stores';

	// falls back to the page's workspace context when there's no active id (e.g. global)
	let { workspaceName = null }: { workspaceName?: string | null } = $props();

	const workspaces = $derived<WorkspaceWithRole[]>($page.data.workspaces || []);
	const activeWorkspaceId = $derived<string | null>($page.data.activeWorkspaceId || null);
	const globalWorkspaceId = $derived($page.data.globalWorkspaceId);
	const active = $derived(workspaces.find((w) => w.workspaceId === activeWorkspaceId));
	const label = $derived(active?.workspaceName ?? workspaceName ?? 'Workspace');

	function isGlobal(id: string): boolean {
		return id === globalWorkspaceId;
	}

	async function select(id: string) {
		if ($workspaceSwitching || id === activeWorkspaceId) return;
		await switchWorkspace(id, $page.url.pathname);
	}
</script>

{#if workspaces.length > 1}
	<DropdownMenu.Root>
		<!-- render the trigger as a real glass-cta button so it matches sibling buttons exactly -->
		<DropdownMenu.Trigger
			disabled={$workspaceSwitching}
			class="glass-cta glass-cta-sm gap-1.5 whitespace-nowrap focus:outline-none focus-visible:outline-none"
		>
			<GalleryHorizontalEnd class="h-4 w-4 text-primary shrink-0" />
			<span class="font-semibold">{label}</span>
			<ChevronDown class="h-3 w-3 opacity-60" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-56 glass-dropdown" align="start">
			<DropdownMenu.Label class="text-xs font-normal text-muted-foreground/70">
				Switch workspace
			</DropdownMenu.Label>
			<DropdownMenu.Separator />
			{#each workspaces as ws (ws.workspaceId)}
				<DropdownMenu.Item onclick={() => select(ws.workspaceId)} class="cursor-pointer gap-2">
					{#if isGlobal(ws.workspaceId)}
						<Globe class="h-4 w-4 text-blue-500 shrink-0" />
					{:else if ws.workspaceType === 'personal'}
						<UserIcon class="h-4 w-4 text-secondary-500 shrink-0" />
					{:else}
						<Users class="h-4 w-4 text-neon-green-500 shrink-0" />
					{/if}
					<span class="truncate">{ws.workspaceName}</span>
					{#if ws.workspaceId === activeWorkspaceId}
						<Check class="ml-auto h-4 w-4 text-primary shrink-0" />
					{/if}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<!-- single workspace: nothing to switch to, static pill sized like the buttons -->
	<div class="glass-cta glass-cta-sm gap-1.5 whitespace-nowrap cursor-default pointer-events-none">
		<GalleryHorizontalEnd class="h-4 w-4 text-primary shrink-0" />
		<span class="font-semibold">{label}</span>
	</div>
{/if}
