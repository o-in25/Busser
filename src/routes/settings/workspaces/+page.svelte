<script lang="ts">
	import {
		Building2,
		Globe,
		Lock,
		Pencil,
		Plus,
		Trash2,
		User,
		UserCog,
		Users,
	} from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const GLOBAL_WORKSPACE_ID = 'ws-global-catalog';

	// Local state
	let createDialogOpen = $state(false);
	let editDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let selectedWorkspace = $state<WorkspaceWithRole | null>(null);

	// Form state
	let newWorkspaceName = $state('');
	let newWorkspaceType = $state<'personal' | 'shared'>('shared');
	let editWorkspaceName = $state('');
	let editWorkspaceType = $state<'personal' | 'shared'>('shared');

	// Count of workspaces
	const workspaceCount = $derived(data?.workspaces?.length || 0);

	// Current workspace ID (from query param)
	const currentWorkspaceId = $derived(data?.currentWorkspaceId || null);

	// Check if workspace is the global workspace
	function isGlobalWorkspace(workspace: WorkspaceWithRole): boolean {
		return workspace.workspaceId === GLOBAL_WORKSPACE_ID;
	}

	// Check if workspace is the current workspace
	function isCurrentWorkspace(workspace: WorkspaceWithRole): boolean {
		return currentWorkspaceId !== null && workspace.workspaceId === currentWorkspaceId;
	}

	// Check if workspace is protected (cannot edit or delete)
	function isProtected(workspace: WorkspaceWithRole): boolean {
		return isGlobalWorkspace(workspace) || isCurrentWorkspace(workspace);
	}

	// Check if user is owner of workspace
	function isOwner(workspace: WorkspaceWithRole): boolean {
		return workspace.workspaceRole === 'owner';
	}

	// Open edit dialog
	function openEditDialog(workspace: WorkspaceWithRole) {
		selectedWorkspace = workspace;
		editWorkspaceName = workspace.workspaceName;
		editWorkspaceType = workspace.workspaceType;
		editDialogOpen = true;
	}

	// Open delete dialog
	function openDeleteDialog(workspace: WorkspaceWithRole) {
		selectedWorkspace = workspace;
		deleteDialogOpen = true;
	}

	// Reset create form
	function resetCreateForm() {
		newWorkspaceName = '';
		newWorkspaceType = 'shared';
	}

	// Format date
	function formatDate(date: Date | string): string {
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Workspaces - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Workspace Management</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Create and manage workspaces for organizing content
			</p>
		</div>
		<Button onclick={() => (createDialogOpen = true)}>
			<Plus class="h-4 w-4 mr-2" />
			Create Workspace
		</Button>
	</div>

	<!-- Error Message -->
	{#if form?.error}
		<div class="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
			{form.error}
		</div>
	{/if}

	<!-- Success Message -->
	{#if form?.success}
		<div class="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-3 rounded-md text-sm">
			Operation completed successfully.
		</div>
	{/if}

	<!-- Workspaces Card -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title class="flex items-center gap-2">
						<Building2 class="h-5 w-5" />
						Workspaces
					</Card.Title>
					<Card.Description>
						{workspaceCount} workspace{workspaceCount !== 1 ? 's' : ''} configured
					</Card.Description>
				</div>
				<Badge variant="secondary" class="text-sm">
					{workspaceCount}
				</Badge>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			{#if data.workspaces && data.workspaces.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="pl-6">Name</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head class="hidden sm:table-cell">Created</Table.Head>
							<Table.Head class="text-right pr-6">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.workspaces as workspace (workspace.workspaceId)}
							<Table.Row class="group">
								<Table.Cell class="pl-6 font-medium">
									<div class="flex items-center gap-2">
										{#if isGlobalWorkspace(workspace)}
											<Globe class="h-4 w-4 text-blue-500 shrink-0" />
										{:else if workspace.workspaceType === 'personal'}
											<User class="h-4 w-4 text-purple-500 shrink-0" />
										{:else}
											<Users class="h-4 w-4 text-green-500 shrink-0" />
										{/if}
										<span class="truncate">{workspace.workspaceName}</span>
										{#if isGlobalWorkspace(workspace)}
											<Badge variant="outline" class="text-xs shrink-0">Global</Badge>
										{/if}
										{#if isCurrentWorkspace(workspace)}
											<Badge variant="secondary" class="text-xs shrink-0">Current</Badge>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge
										variant={workspace.workspaceType === 'personal' ? 'secondary' : 'default'}
										class="gap-1"
									>
										{#if workspace.workspaceType === 'personal'}
											<User class="h-3 w-3" />
										{:else}
											<Users class="h-3 w-3" />
										{/if}
										{workspace.workspaceType.charAt(0).toUpperCase() +
											workspace.workspaceType.slice(1)}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge
										variant={workspace.workspaceRole === 'owner'
											? 'default'
											: workspace.workspaceRole === 'editor'
												? 'secondary'
												: 'outline'}
									>
										{workspace.workspaceRole.charAt(0).toUpperCase() +
											workspace.workspaceRole.slice(1)}
									</Badge>
								</Table.Cell>
								<Table.Cell class="hidden sm:table-cell text-muted-foreground">
									{formatDate(workspace.createdDate)}
								</Table.Cell>
								<Table.Cell class="text-right pr-6">
									<div class="flex items-center justify-end gap-2">
										<!-- Members button (only for owners) -->
										{#if isOwner(workspace)}
											<a
												href="/settings/workspaces/{workspace.workspaceId}/members"
												class="inline-flex items-center justify-center h-8 w-8 rounded-md border bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
												title="Manage members"
											>
												<UserCog class="h-4 w-4" />
												<span class="sr-only">Manage members</span>
											</a>
										{/if}
										{#if isProtected(workspace)}
											<!-- Protected workspace: show disabled styled buttons -->
											<Button
												variant="outline"
												size="icon"
												disabled
												class="h-8 w-8 opacity-40"
												title={isGlobalWorkspace(workspace)
													? 'Cannot modify the global workspace'
													: 'Cannot modify the workspace you are currently in'}
											>
												<Lock class="h-4 w-4" />
												<span class="sr-only">Protected</span>
											</Button>
											<Button
												variant="outline"
												size="icon"
												disabled
												class="h-8 w-8 opacity-40"
												title={isGlobalWorkspace(workspace)
													? 'Cannot delete the global workspace'
													: 'Cannot delete the workspace you are currently in'}
											>
												<Lock class="h-4 w-4" />
												<span class="sr-only">Protected</span>
											</Button>
										{:else if isOwner(workspace)}
											<!-- Editable workspace: show edit and delete buttons (only for owners) -->
											<Button
												variant="outline"
												size="icon"
												class="h-8 w-8 bg-violet-500/20 border-violet-500/50 text-violet-400 hover:bg-violet-500 hover:text-white"
												onclick={() => openEditDialog(workspace)}
												title="Edit workspace"
											>
												<Pencil class="h-4 w-4" />
												<span class="sr-only">Edit</span>
											</Button>
											<Button
												variant="outline"
												size="icon"
												class="h-8 w-8 bg-destructive/20 border-destructive/50 text-red-400 hover:bg-destructive hover:text-destructive-foreground"
												onclick={() => openDeleteDialog(workspace)}
												title="Delete workspace"
											>
												<Trash2 class="h-4 w-4" />
												<span class="sr-only">Delete</span>
											</Button>
										{/if}
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<Building2 class="h-12 w-12 text-muted-foreground/50 mb-4" />
					<h3 class="text-lg font-medium">No workspaces found</h3>
					<p class="text-sm text-muted-foreground mt-1">
						Create your first workspace to get started.
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Create Workspace Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Create Workspace</Dialog.Title>
			<Dialog.Description>
				Create a new workspace to organize content and manage access.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						createDialogOpen = false;
						resetCreateForm();
					}
					await update();
				};
			}}
		>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="workspaceName">Name</Label>
					<Input
						id="workspaceName"
						name="workspaceName"
						placeholder="My Workspace"
						bind:value={newWorkspaceName}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="workspaceType">Type</Label>
					<Select.Root
						type="single"
						name="workspaceType"
						value={newWorkspaceType}
						onValueChange={(v) => (newWorkspaceType = v as 'personal' | 'shared')}
					>
						<Select.Trigger>
							<Select.Value placeholder="Select type" />
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
									<User class="h-4 w-4" />
									Personal
								</div>
							</Select.Item>
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="workspaceType" value={newWorkspaceType} />
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (createDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Create</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Workspace Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Edit Workspace</Dialog.Title>
			<Dialog.Description>Update the workspace name and type.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/update"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						editDialogOpen = false;
						selectedWorkspace = null;
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="workspaceId" value={selectedWorkspace?.workspaceId || ''} />
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="editWorkspaceName">Name</Label>
					<Input
						id="editWorkspaceName"
						name="workspaceName"
						bind:value={editWorkspaceName}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="editWorkspaceType">Type</Label>
					<Select.Root
						type="single"
						name="workspaceType"
						value={editWorkspaceType}
						onValueChange={(v) => (editWorkspaceType = v as 'personal' | 'shared')}
						disabled={selectedWorkspace ? isGlobalWorkspace(selectedWorkspace) : false}
					>
						<Select.Trigger>
							<Select.Value placeholder="Select type" />
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
									<User class="h-4 w-4" />
									Personal
								</div>
							</Select.Item>
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="workspaceType" value={editWorkspaceType} />
					{#if selectedWorkspace && isGlobalWorkspace(selectedWorkspace)}
						<p class="text-xs text-muted-foreground">
							The global workspace type cannot be changed.
						</p>
					{/if}
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (editDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Save Changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Workspace Confirmation -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Delete Workspace</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{selectedWorkspace?.workspaceName}"? This action cannot be
				undone and will remove all workspace associations.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button type="button" variant="outline" onclick={() => (deleteDialogOpen = false)}>
				Cancel
			</Button>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							deleteDialogOpen = false;
							selectedWorkspace = null;
						}
						await update();
					};
				}}
				class="inline"
			>
				<input type="hidden" name="workspaceId" value={selectedWorkspace?.workspaceId || ''} />
				<Button type="submit" variant="destructive">Delete</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
