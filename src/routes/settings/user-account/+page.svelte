<script lang="ts">
	import {
		ArrowRight,
		Building2,
		Check,
		Crown,
		Globe,
		KeyRound,
		Mail,
		Pencil,
		Shield,
		User,
		Users,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { enhance } from '$app/forms';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { cn } from '$lib/utils';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Track selected workspace for the form
	let selectedWorkspaceId = $state(data.preferredWorkspaceId || '');
	let isSubmitting = $state(false);

	// Update selected when data changes
	$effect(() => {
		selectedWorkspaceId = data.preferredWorkspaceId || '';
	});

	const permissions: string[] = getContext('permissions') || [];
	const roles: string[] = getContext('roles') || [];

	// filter to only admin-related permissions (system-level access)
	const adminPermissions = permissions.filter((p) => p.includes('admin'));

	// workspace role descriptions
	const roleDescriptions: Record<
		string,
		{ label: string; description: string; color: string; bg: string }
	> = {
		owner: {
			label: 'Owner',
			description: 'Full access. Can manage members, settings, and all content.',
			color: 'text-amber-500',
			bg: 'bg-amber-500/10',
		},
		editor: {
			label: 'Editor',
			description: 'Can create, edit, and delete recipes and inventory.',
			color: 'text-blue-500',
			bg: 'bg-blue-500/10',
		},
		viewer: {
			label: 'Viewer',
			description: 'Read-only access. Can view but not modify content.',
			color: 'text-emerald-500',
			bg: 'bg-emerald-500/10',
		},
	};

	// admin permission descriptions
	const adminPermissionDescriptions: Record<string, string> = {
		view_admin: 'View admin settings and user list',
		edit_admin: 'Manage users and workspace settings',
		delete_admin: 'Delete users from the system',
	};
</script>

<svelte:head>
	<title>Account - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Account Settings</h1>
			<p class="text-sm text-muted-foreground mt-1">View your account details and permissions</p>
		</div>
		<a
			class={cn(buttonVariants({ variant: 'default' }))}
			href="/settings/users/{data.user?.userId}/edit"
		>
			<Pencil class="h-4 w-4 mr-2" />
			Edit Account
		</a>
	</div>

	<!-- Profile Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<User class="h-5 w-5" />
				Profile Information
			</Card.Title>
			<Card.Description>Your account details and assigned roles</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-6 sm:grid-cols-2">
				<!-- Username -->
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<User class="h-4 w-4" />
						Username
					</div>
					<p class="text-lg font-semibold">{data.user?.username}</p>
				</div>

				<!-- Email -->
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<Mail class="h-4 w-4" />
						Email Address
					</div>
					<p class="text-lg font-semibold">{data.user?.email}</p>
				</div>

				<!-- Roles -->
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<KeyRound class="h-4 w-4" />
						Assigned Roles
					</div>
					<div class="flex flex-wrap gap-2">
						{#if roles.length > 0}
							{#each roles as role}
								<Badge variant="secondary" class="text-sm px-3 py-1">
									<Shield class="h-3.5 w-3.5 mr-1.5" />
									{role}
								</Badge>
							{/each}
						{:else}
							<span class="text-muted-foreground text-sm">No roles assigned</span>
						{/if}
					</div>
				</div>

				<!-- Current Workspace -->
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<Building2 class="h-4 w-4" />
						Current Workspace
					</div>
					{#if data.currentWorkspace}
						<div class="flex items-center gap-3">
							<div
								class="p-2 rounded-lg {data.currentWorkspace.workspaceId === 'ws-global-catalog'
									? 'bg-blue-500/10'
									: data.currentWorkspace.workspaceType === 'personal'
										? 'bg-purple-500/10'
										: 'bg-green-500/10'}"
							>
								{#if data.currentWorkspace.workspaceId === 'ws-global-catalog'}
									<Globe class="h-4 w-4 text-blue-500" />
								{:else if data.currentWorkspace.workspaceType === 'personal'}
									<User class="h-4 w-4 text-purple-500" />
								{:else}
									<Users class="h-4 w-4 text-green-500" />
								{/if}
							</div>
							<div>
								<p class="text-lg font-semibold">{data.currentWorkspace.workspaceName}</p>
								<p class="text-sm text-muted-foreground capitalize">
									{data.currentWorkspace.workspaceType} workspace
								</p>
							</div>
							<Badge variant="secondary" class="ml-auto capitalize">
								{#if data.currentWorkspace.workspaceRole === 'owner'}
									<Crown class="h-3 w-3 mr-1" />
								{/if}
								{data.currentWorkspace.workspaceRole}
							</Badge>
						</div>
					{:else}
						<p class="text-muted-foreground text-sm">No workspace currently selected</p>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- System Access Card (Admin Permissions) -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Shield class="h-5 w-5" />
				System Access
			</Card.Title>
			<Card.Description>Your administrative permissions for system-level features</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if adminPermissions.length > 0}
				<div class="space-y-3">
					{#each adminPermissions as permission}
						<div class="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
							<div class="p-2 rounded-lg bg-primary/10">
								<Shield class="h-4 w-4 text-primary" />
							</div>
							<div>
								<p class="font-medium">
									{permission.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
								</p>
								<p class="text-sm text-muted-foreground">
									{adminPermissionDescriptions[permission] || 'System administrative access'}
								</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8">
					<div
						class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4"
					>
						<Shield class="h-8 w-8 text-muted-foreground/50" />
					</div>
					<h3 class="font-semibold mb-1">Standard User</h3>
					<p class="text-sm text-muted-foreground">
						You have standard user access. Your permissions for recipes and inventory are determined
						by your role in each workspace.
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Workspace Access Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Building2 class="h-5 w-5" />
				Workspace Access
			</Card.Title>
			<Card.Description>
				Your access level in each workspace determines what you can do with recipes and inventory
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.workspaces && data.workspaces.length > 0}
				<div class="space-y-3 mb-6">
					{#each data.workspaces as workspace (workspace.workspaceId)}
						{@const roleInfo = roleDescriptions[workspace.workspaceRole]}
						<div class="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-3">
									<div
										class="p-2 rounded-lg {workspace.workspaceId === 'ws-global-catalog'
											? 'bg-blue-500/10'
											: workspace.workspaceType === 'personal'
												? 'bg-purple-500/10'
												: 'bg-green-500/10'}"
									>
										{#if workspace.workspaceId === 'ws-global-catalog'}
											<Globe class="h-4 w-4 text-blue-500" />
										{:else if workspace.workspaceType === 'personal'}
											<User class="h-4 w-4 text-purple-500" />
										{:else}
											<Users class="h-4 w-4 text-green-500" />
										{/if}
									</div>
									<div>
										<div class="font-medium flex items-center gap-2">
											{workspace.workspaceName}
											{#if workspace.workspaceId === 'ws-global-catalog'}
												<Badge variant="outline" class="text-xs">Global</Badge>
											{/if}
										</div>
									</div>
								</div>
								<Badge class="{roleInfo.bg} {roleInfo.color} border-0">
									{#if workspace.workspaceRole === 'owner'}
										<Crown class="h-3 w-3 mr-1" />
									{/if}
									{roleInfo.label}
								</Badge>
							</div>
							<p class="text-sm text-muted-foreground ml-11">
								{roleInfo.description}
							</p>
						</div>
					{/each}
				</div>

				<!-- Role Legend -->
				<div class="p-4 rounded-lg border border-dashed mb-6">
					<h4 class="text-sm font-medium mb-3">Role Permissions</h4>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
						{#each Object.entries(roleDescriptions) as [role, info]}
							<div class="flex items-start gap-2">
								<Badge class="{info.bg} {info.color} border-0 shrink-0">
									{#if role === 'owner'}
										<Crown class="h-3 w-3 mr-1" />
									{/if}
									{info.label}
								</Badge>
								<span class="text-muted-foreground text-xs">{info.description}</span>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="text-center py-8">
					<div
						class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4"
					>
						<Building2 class="h-8 w-8 text-muted-foreground/50" />
					</div>
					<h3 class="font-semibold mb-1">No Workspaces</h3>
					<p class="text-sm text-muted-foreground">You don't belong to any workspaces yet.</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Default Workspace Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<ArrowRight class="h-5 w-5" />
				Default Workspace
			</Card.Title>
			<Card.Description>
				Select your preferred workspace. This will be automatically selected when you log in.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.workspaces && data.workspaces.length > 0}
				<form
					method="POST"
					action="?/setPreferredWorkspace"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							isSubmitting = false;
							await update();
						};
					}}
				>
					<div class="space-y-2 mb-4">
						{#each data.workspaces as workspace (workspace.workspaceId)}
							<button
								type="button"
								onclick={() => (selectedWorkspaceId = workspace.workspaceId)}
								class="w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all {selectedWorkspaceId ===
								workspace.workspaceId
									? 'border-primary bg-primary/5'
									: 'border-transparent bg-muted/30 hover:bg-muted/50'}"
							>
								<div class="flex items-center gap-3">
									<div
										class="p-2 rounded-lg {workspace.workspaceId === 'ws-global-catalog'
											? 'bg-blue-500/10'
											: workspace.workspaceType === 'personal'
												? 'bg-purple-500/10'
												: 'bg-green-500/10'}"
									>
										{#if workspace.workspaceId === 'ws-global-catalog'}
											<Globe class="h-4 w-4 text-blue-500" />
										{:else if workspace.workspaceType === 'personal'}
											<User class="h-4 w-4 text-purple-500" />
										{:else}
											<Users class="h-4 w-4 text-green-500" />
										{/if}
									</div>
									<div class="text-left">
										<div class="font-medium flex items-center gap-2">
											{workspace.workspaceName}
											{#if workspace.workspaceId === 'ws-global-catalog'}
												<Badge variant="outline" class="text-xs">Global</Badge>
											{/if}
										</div>
										<div class="text-sm text-muted-foreground capitalize">
											{workspace.workspaceType} workspace
										</div>
									</div>
								</div>
								<div class="flex items-center gap-2">
									{#if selectedWorkspaceId === workspace.workspaceId}
										<div class="w-2 h-2 rounded-full bg-primary"></div>
									{/if}
								</div>
							</button>
						{/each}
					</div>

					<input type="hidden" name="workspaceId" value={selectedWorkspaceId} />

					<div class="flex items-center justify-between">
						{#if form?.success}
							<p class="text-sm text-green-600 flex items-center gap-1">
								<Check class="h-4 w-4" />
								Preference saved
							</p>
						{:else if form?.error}
							<p class="text-sm text-destructive">{form.error}</p>
						{:else}
							<div></div>
						{/if}
						<Button
							type="submit"
							disabled={!selectedWorkspaceId ||
								selectedWorkspaceId === data.preferredWorkspaceId ||
								isSubmitting}
						>
							{#if isSubmitting}
								Saving...
							{:else}
								Save Preference
							{/if}
						</Button>
					</div>
				</form>
			{:else}
				<div class="text-center py-8">
					<div
						class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4"
					>
						<Building2 class="h-8 w-8 text-muted-foreground/50" />
					</div>
					<h3 class="font-semibold mb-1">No Workspaces</h3>
					<p class="text-sm text-muted-foreground">You don't belong to any workspaces yet.</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
