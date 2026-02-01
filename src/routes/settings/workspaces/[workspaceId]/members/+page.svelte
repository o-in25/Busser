<script lang="ts">
	import { Clock, Crown, Eye, Mail, Pencil, Shield, Trash2, Users } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import BackButton from '$lib/components/BackButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// local state
	let inviteDialogOpen = $state(false);
	let removeDialogOpen = $state(false);
	let selectedUserId = $state<string | null>(null);
	let selectedUsername = $state<string>('');

	// form state
	let inviteEmail = $state('');
	let inviteRole = $state<'owner' | 'editor' | 'viewer'>('viewer');

	// role display helpers
	const roleLabels: Record<string, string> = {
		owner: 'Owner',
		editor: 'Editor',
		viewer: 'Viewer',
	};

	const roleIcons: Record<string, typeof Crown> = {
		owner: Crown,
		editor: Pencil,
		viewer: Eye,
	};

	const roleVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
		owner: 'default',
		editor: 'secondary',
		viewer: 'outline',
	};

	// open remove confirmation dialog
	function openRemoveDialog(userId: string, username: string) {
		selectedUserId = userId;
		selectedUsername = username;
		removeDialogOpen = true;
	}

	// reset invite form
	function resetInviteForm() {
		inviteEmail = '';
		inviteRole = 'viewer';
	}

	// format date
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
	<title>Manage Members - {data.workspace.workspaceName} - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header with back link -->
	<div class="flex items-center gap-4">
		<BackButton
			fallback="/settings/workspaces"
			label="Back to Workspaces"
			size="sm"
			variant="ghost"
			class="text-muted-foreground hover:text-foreground"
		/>
	</div>

	<!-- Title -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Manage Members</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Manage access to <span class="font-medium">{data.workspace.workspaceName}</span>
			</p>
		</div>
		<Button onclick={() => (inviteDialogOpen = true)}>
			<Mail class="h-4 w-4 mr-2" />
			Invite Member
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
			{#if form.action === 'update'}
				Member role updated successfully.
			{:else if form.action === 'remove'}
				Member removed successfully.
			{:else if form.action === 'invite'}
				Invitation sent successfully.
			{:else if form.action === 'cancel'}
				Invitation cancelled.
			{:else}
				Operation completed successfully.
			{/if}
		</div>
	{/if}

	<!-- Members Card -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title class="flex items-center gap-2">
						<Users class="h-5 w-5" />
						Members
					</Card.Title>
					<Card.Description>
						{data.members.length} member{data.members.length !== 1 ? 's' : ''} in this workspace
					</Card.Description>
				</div>
				<Badge variant="secondary" class="text-sm">
					{data.members.length}
				</Badge>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			{#if data.members.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="pl-6">User</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head class="hidden sm:table-cell">Joined</Table.Head>
							<Table.Head class="text-right pr-6">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.members as member (member.userId)}
							{@const RoleIcon = roleIcons[member.workspaceRole]}
							{@const isCurrentUser = member.userId === data.currentUserId}
							<Table.Row class="group">
								<Table.Cell class="pl-6">
									<div class="flex flex-col">
										<span class="font-medium">
											{member.username}
											{#if isCurrentUser}
												<Badge variant="outline" class="ml-2 text-xs">You</Badge>
											{/if}
										</span>
										<span class="text-sm text-muted-foreground">{member.email}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if isCurrentUser}
										<!-- current user cannot change their own role -->
										<Badge variant={roleVariants[member.workspaceRole]} class="gap-1">
											<RoleIcon class="h-3 w-3" />
											{roleLabels[member.workspaceRole]}
										</Badge>
									{:else}
										<!-- role dropdown for other users -->
										<form method="POST" action="?/updateRole" use:enhance class="inline">
											<input type="hidden" name="userId" value={member.userId} />
											<Select.Root
												type="single"
												name="role"
												value={member.workspaceRole}
												onValueChange={(v) => {
													if (v && v !== member.workspaceRole) {
														// submit form when role changes
														const form = document.getElementById(
															`role-form-${member.userId}`
														) as HTMLFormElement;
														if (form) {
															const input = form.querySelector(
																'input[name="role"]'
															) as HTMLInputElement;
															if (input) input.value = v;
															form.requestSubmit();
														}
													}
												}}
											>
												<Select.Trigger class="w-32">
													<Select.Value placeholder="Select role" />
												</Select.Trigger>
												<Select.Content>
													<Select.Item value="owner" label="Owner">
														<div class="flex items-center gap-2">
															<Crown class="h-4 w-4" />
															Owner
														</div>
													</Select.Item>
													<Select.Item value="editor" label="Editor">
														<div class="flex items-center gap-2">
															<Pencil class="h-4 w-4" />
															Editor
														</div>
													</Select.Item>
													<Select.Item value="viewer" label="Viewer">
														<div class="flex items-center gap-2">
															<Eye class="h-4 w-4" />
															Viewer
														</div>
													</Select.Item>
												</Select.Content>
											</Select.Root>
											<input type="hidden" name="role" value={member.workspaceRole} />
										</form>
										<!-- hidden form for programmatic submission -->
										<form
											id="role-form-{member.userId}"
											method="POST"
											action="?/updateRole"
											use:enhance
											class="hidden"
										>
											<input type="hidden" name="userId" value={member.userId} />
											<input type="hidden" name="role" value={member.workspaceRole} />
										</form>
									{/if}
								</Table.Cell>
								<Table.Cell class="hidden sm:table-cell text-muted-foreground">
									{formatDate(member.joinedDate)}
								</Table.Cell>
								<Table.Cell class="text-right pr-6">
									{#if isCurrentUser}
										<Button
											variant="outline"
											size="icon"
											disabled
											class="h-8 w-8 opacity-40"
											title="You cannot remove yourself"
										>
											<Shield class="h-4 w-4" />
											<span class="sr-only">Protected</span>
										</Button>
									{:else}
										<Button
											variant="outline"
											size="icon"
											class="h-8 w-8 bg-destructive/20 border-destructive/50 text-red-400 hover:bg-destructive hover:text-destructive-foreground"
											onclick={() => openRemoveDialog(member.userId, member.username)}
											title="Remove member"
										>
											<Trash2 class="h-4 w-4" />
											<span class="sr-only">Remove</span>
										</Button>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<Users class="h-12 w-12 text-muted-foreground/50 mb-4" />
					<h3 class="text-lg font-medium">No members</h3>
					<p class="text-sm text-muted-foreground mt-1">Add members to share this workspace.</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Pending Invitations -->
	{#if data.pendingInvitations.length > 0}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="flex items-center gap-2">
							<Clock class="h-5 w-5" />
							Pending Invitations
						</Card.Title>
						<Card.Description>
							{data.pendingInvitations.length} pending invitation{data.pendingInvitations.length !==
							1
								? 's'
								: ''}
						</Card.Description>
					</div>
					<Badge variant="outline" class="text-sm">
						{data.pendingInvitations.length}
					</Badge>
				</div>
			</Card.Header>
			<Card.Content class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="pl-6">Email</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head class="hidden sm:table-cell">Expires</Table.Head>
							<Table.Head class="text-right pr-6">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.pendingInvitations as invitation (invitation.invitationId)}
							{@const RoleIcon = roleIcons[invitation.workspaceRole || 'viewer']}
							<Table.Row>
								<Table.Cell class="pl-6">
									<span class="font-medium">{invitation.email}</span>
								</Table.Cell>
								<Table.Cell>
									<Badge
										variant={roleVariants[invitation.workspaceRole || 'viewer']}
										class="gap-1"
									>
										<RoleIcon class="h-3 w-3" />
										{roleLabels[invitation.workspaceRole || 'viewer']}
									</Badge>
								</Table.Cell>
								<Table.Cell class="hidden sm:table-cell text-muted-foreground">
									{invitation.expiresAt ? formatDate(invitation.expiresAt) : 'Never'}
								</Table.Cell>
								<Table.Cell class="text-right pr-6">
									<form
										method="POST"
										action="?/cancelInvitation"
										use:enhance
										class="inline"
									>
										<input type="hidden" name="invitationId" value={invitation.invitationId} />
										<Button
											type="submit"
											variant="outline"
											size="icon"
											class="h-8 w-8 bg-destructive/20 border-destructive/50 text-red-400 hover:bg-destructive hover:text-destructive-foreground"
											title="Cancel invitation"
										>
											<Trash2 class="h-4 w-4" />
											<span class="sr-only">Cancel</span>
										</Button>
									</form>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Role Legend -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-sm">Role Permissions</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
				<div class="flex items-start gap-3">
					<Badge variant="default" class="gap-1 shrink-0">
						<Crown class="h-3 w-3" />
						Owner
					</Badge>
					<p class="text-muted-foreground">
						Full access. Can manage members, settings, and all content.
					</p>
				</div>
				<div class="flex items-start gap-3">
					<Badge variant="secondary" class="gap-1 shrink-0">
						<Pencil class="h-3 w-3" />
						Editor
					</Badge>
					<p class="text-muted-foreground">Can create, edit, and delete recipes and inventory.</p>
				</div>
				<div class="flex items-start gap-3">
					<Badge variant="outline" class="gap-1 shrink-0">
						<Eye class="h-3 w-3" />
						Viewer
					</Badge>
					<p class="text-muted-foreground">Read-only access. Can view but not modify content.</p>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- Remove Member Confirmation -->
<Dialog.Root bind:open={removeDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Remove Member</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to remove <span class="font-medium">{selectedUsername}</span> from this
				workspace? They will lose access to all workspace content.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button type="button" variant="outline" onclick={() => (removeDialogOpen = false)}>
				Cancel
			</Button>
			<form
				method="POST"
				action="?/removeMember"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							removeDialogOpen = false;
							selectedUserId = null;
							selectedUsername = '';
						}
						await update();
					};
				}}
				class="inline"
			>
				<input type="hidden" name="userId" value={selectedUserId || ''} />
				<Button type="submit" variant="destructive">Remove</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Invite Member Dialog -->
<Dialog.Root bind:open={inviteDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Invite Member</Dialog.Title>
			<Dialog.Description>
				Send an invitation email. They'll be added to this workspace when they accept.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/inviteNewUser"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						inviteDialogOpen = false;
						resetInviteForm();
					}
					await update();
				};
			}}
		>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="email">Email Address</Label>
					<Input
						type="email"
						id="email"
						name="email"
						placeholder="colleague@example.com"
						bind:value={inviteEmail}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="inviteRole">Role</Label>
					<Select.Root
						type="single"
						name="role"
						value={inviteRole}
						onValueChange={(v) => (inviteRole = (v as 'owner' | 'editor' | 'viewer') ?? 'viewer')}
					>
						<Select.Trigger>
							<Select.Value placeholder="Select role" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="viewer" label="Viewer">
								<div class="flex items-center gap-2">
									<Eye class="h-4 w-4" />
									Viewer (read-only)
								</div>
							</Select.Item>
							<Select.Item value="editor" label="Editor">
								<div class="flex items-center gap-2">
									<Pencil class="h-4 w-4" />
									Editor (can modify)
								</div>
							</Select.Item>
							<Select.Item value="owner" label="Owner">
								<div class="flex items-center gap-2">
									<Crown class="h-4 w-4" />
									Owner (full access)
								</div>
							</Select.Item>
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="role" value={inviteRole} />
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (inviteDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={!inviteEmail}>
					<Mail class="h-4 w-4 mr-2" />
					Send Invitation
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
