<script lang="ts">
	import {
		Check,
		ChevronDown,
		GalleryHorizontalEnd,
		Globe,
		Plus,
		User as UserIcon,
		Users,
	} from 'lucide-svelte';

	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { WorkspaceWithRole } from '$lib/types/workspace';
	import { createAndSwitchWorkspace, switchWorkspace } from '$lib/utils/workspace';
	import { workspaceSwitching } from '../../stores';

	// 'pill' is the compact header badge; 'card' matches the dashboard quick-action tiles
	let {
		workspaceName = null,
		variant = 'pill',
	}: { workspaceName?: string | null; variant?: 'pill' | 'card' } = $props();

	const workspaces = $derived<WorkspaceWithRole[]>($page.data.workspaces || []);
	const activeWorkspaceId = $derived<string | null>($page.data.activeWorkspaceId || null);
	const globalWorkspaceId = $derived($page.data.globalWorkspaceId);
	const active = $derived(workspaces.find((w) => w.workspaceId === activeWorkspaceId));
	const label = $derived(active?.workspaceName ?? workspaceName ?? 'Workspace');

	// create-workspace modal state
	let createDialogOpen = $state(false);
	let newWorkspaceName = $state('');
	let newWorkspaceType = $state<'personal' | 'shared'>('shared');
	let creating = $state(false);

	function isGlobal(id: string): boolean {
		return id === globalWorkspaceId;
	}

	async function select(id: string) {
		if ($workspaceSwitching || id === activeWorkspaceId) return;
		await switchWorkspace(id);
	}

	function openCreate() {
		newWorkspaceName = '';
		newWorkspaceType = 'shared';
		createDialogOpen = true;
	}

	// create the workspace then switch straight into it (skeletons come from switchWorkspace)
	async function createAndSwitch() {
		const name = newWorkspaceName.trim();
		if (!name || creating) return;
		creating = true;
		try {
			const created = await createAndSwitchWorkspace(name, newWorkspaceType);
			if (!created) {
				toast.error('Could not create workspace.');
				return;
			}
			createDialogOpen = false;
		} finally {
			creating = false;
		}
	}
</script>

{#if workspaces.length >= 1}
	<DropdownMenu.Root>
		{#if variant === 'card'}
			<!-- card trigger sized like the sibling quick-action tiles -->
			<DropdownMenu.Trigger
				disabled={$workspaceSwitching}
				class="block h-full w-full text-left focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Card.Root
					class="flex items-center min-h-[76px] p-4 h-full hover:shadow-md transition-shadow hover:border-primary/50 cursor-pointer dark:hover:shadow-glow-pink"
				>
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-primary/10">
							<GalleryHorizontalEnd class="h-5 w-5 text-primary" />
						</div>
						<div class="min-w-0">
							<p class="font-medium">Switch Workspace</p>
							<p class="hidden md:block text-xs text-muted-foreground truncate">{label}</p>
						</div>
					</div>
				</Card.Root>
			</DropdownMenu.Trigger>
		{:else}
			<!-- render the trigger as a real glass-cta button so it matches sibling buttons exactly -->
			<DropdownMenu.Trigger
				disabled={$workspaceSwitching}
				class="glass-cta glass-cta-sm gap-1.5 whitespace-nowrap focus:outline-none focus-visible:outline-none"
			>
				<GalleryHorizontalEnd class="h-4 w-4 text-primary shrink-0" />
				<span class="font-semibold">{label}</span>
				<ChevronDown class="h-3 w-3 opacity-60" />
			</DropdownMenu.Trigger>
		{/if}
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
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={openCreate} class="cursor-pointer gap-2">
				<Plus class="h-4 w-4 text-primary shrink-0" />
				<span>New workspace</span>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}

<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Create workspace</Dialog.Title>
			<Dialog.Description>Add a new workspace and switch into it.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="newWorkspaceName">Name</Label>
				<Input
					id="newWorkspaceName"
					bind:value={newWorkspaceName}
					placeholder="e.g. Home Bar"
					required
				/>
			</div>
			<div class="grid gap-2">
				<Label for="newWorkspaceType">Type</Label>
				<Select.Root
					type="single"
					value={newWorkspaceType}
					onValueChange={(v) => (newWorkspaceType = v as 'personal' | 'shared')}
				>
					<Select.Trigger>
						<Select.Value placeholder="Select type">
							{newWorkspaceType.charAt(0).toUpperCase() + newWorkspaceType.slice(1)}
						</Select.Value>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="shared" label="Shared">
							<div class="flex items-center gap-2">
								<Users class="h-4 w-4" />
								Shared
							</div>
						</Select.Item>
						<Select.Item value="personal" label="Personal">
							<div class="flex items-center gap-2">
								<UserIcon class="h-4 w-4" />
								Personal
							</div>
						</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
		<Dialog.Footer>
			<Button type="button" variant="outline" onclick={() => (createDialogOpen = false)}>
				Cancel
			</Button>
			<Button
				type="button"
				onclick={createAndSwitch}
				disabled={creating || !newWorkspaceName.trim()}
			>
				{creating ? 'Creating…' : 'Create & switch'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
