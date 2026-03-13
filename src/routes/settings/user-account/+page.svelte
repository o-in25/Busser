<script lang="ts">
	import {
		AlertTriangle,
		Crown,
		Globe,
		KeyRound,
		GalleryHorizontalEnd,
		Link2,
		Lock,
		LogOut,
		Mail,
		Shield,
		Trash2,
		Unlink,
		User,
		Users,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { cn } from '$lib/utils';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSigningOut = $state(false);
	let isDeleting = $state(false);
	let deleteDialogOpen = $state(false);
	let deleteError = $state('');
	let unlinkDialogOpen = $state(false);
	let unlinkProvider = $state('');
	let isUnlinking = $state(false);
	let unlinkError = $state('');

	const permissions: string[] = getContext('permissions') || [];
	const roles: string[] = getContext('roles') || [];

	// users with delete_admin permission cannot delete their own account
	const isAdmin = permissions.includes('delete_admin');

	async function handleSignOut() {
		isSigningOut = true;
		const response = await fetch('/logout', {
			method: 'POST',
			body: new FormData(),
		});
		if (response.ok) {
			await goto('/');
		}
		isSigningOut = false;
	}

	// filter to only admin-related permissions (system-level access)
	const adminPermissions = permissions.filter((p) => p.includes('admin'));

	// admin permission descriptions
	const adminPermissionDescriptions: Record<string, string> = {
		view_admin: 'View admin settings and user list',
		edit_admin: 'Manage users and workspace settings',
		delete_admin: 'Delete users from the system',
	};

	const providerLabels: Record<string, string> = {
		google: 'Google',
		apple: 'Apple',
	};

	function formatLinkedDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	function openUnlinkDialog(provider: string) {
		unlinkProvider = provider;
		unlinkError = '';
		unlinkDialogOpen = true;
	}
</script>

<svelte:head>
	<title>Account - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Account Settings</h1>
			<p class="text-sm text-muted-foreground mt-1">View your account details and permissions</p>
		</div>
		<a
			class={cn(buttonVariants({ variant: 'default' }), 'w-fit')}
			href="/settings/users/{data.user?.userId}/edit"
		>
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
		<Card.Content class="space-y-5">
			<!-- Identity -->
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="p-4 rounded-lg bg-muted/30 space-y-1">
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<User class="h-3.5 w-3.5" />
						Username
					</div>
					<p class="font-semibold">{data.user?.username}</p>
				</div>
				<div class="p-4 rounded-lg bg-muted/30 space-y-1">
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<Mail class="h-3.5 w-3.5" />
						Email Address
					</div>
					<p class="font-semibold">{data.user?.email}</p>
				</div>
			</div>

			<!-- Roles -->
			<div class="p-4 rounded-lg bg-muted/30 space-y-2">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<KeyRound class="h-3.5 w-3.5" />
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
			<div class="p-4 rounded-lg bg-muted/30 space-y-2">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<GalleryHorizontalEnd class="h-3.5 w-3.5" />
					Current Workspace
				</div>
				{#if data.currentWorkspace}
					<div class="flex items-center gap-3">
						<div
							class="p-2 rounded-lg {data.currentWorkspace.workspaceId === 'ws-global-catalog'
								? 'bg-blue-500/10'
								: data.currentWorkspace.workspaceType === 'personal'
									? 'bg-secondary-500/10'
									: 'bg-neon-green-500/10'}"
						>
							{#if data.currentWorkspace.workspaceId === 'ws-global-catalog'}
								<Globe class="h-4 w-4 text-blue-500" />
							{:else if data.currentWorkspace.workspaceType === 'personal'}
								<User class="h-4 w-4 text-secondary-500" />
							{:else}
								<Users class="h-4 w-4 text-neon-green-500" />
							{/if}
						</div>
						<div>
							<p class="font-semibold">{data.currentWorkspace.workspaceName}</p>
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
		</Card.Content>
	</Card.Root>

	<!-- System Access Card (only shown for users with admin permissions) -->
	{#if adminPermissions.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Shield class="h-5 w-5" />
					System Access
				</Card.Title>
				<Card.Description>Your administrative permissions for system-level features</Card.Description>
			</Card.Header>
			<Card.Content>
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
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Connected Accounts Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Link2 class="h-5 w-5" />
				Connected Accounts
			</Card.Title>
			<Card.Description>OAuth providers linked to your account</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.linkedAccounts && data.linkedAccounts.length > 0}
				<div class="space-y-3">
					{#each data.linkedAccounts as account}
						<div
							class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30"
						>
							<div class="flex items-center gap-3">
								<div class="p-2 rounded-lg bg-muted shrink-0">
									{#if account.provider === 'google'}
										<svg class="h-4 w-4" viewBox="0 0 24 24">
											<path
												fill="#4285F4"
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
											/>
											<path
												fill="#34A853"
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											/>
											<path
												fill="#FBBC05"
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											/>
											<path
												fill="#EA4335"
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											/>
										</svg>
									{:else}
										<Link2 class="h-4 w-4 text-muted-foreground" />
									{/if}
								</div>
								<div>
									<p class="font-medium">{providerLabels[account.provider] || account.provider}</p>
									<p class="text-sm text-muted-foreground">
										Linked {formatLinkedDate(account.createdAt)}
									</p>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								class="shrink-0 sm:w-auto w-full"
								onclick={() => openUnlinkDialog(account.provider)}
							>
								Unlink
							</Button>
						</div>
					{/each}
				</div>

				<!-- Unlink confirmation dialog -->
				<Dialog.Root bind:open={unlinkDialogOpen}>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title class="flex items-center gap-2">
								<Unlink class="h-5 w-5" />
								Unlink {providerLabels[unlinkProvider] || unlinkProvider}
							</Dialog.Title>
							<Dialog.Description>
								This will remove {providerLabels[unlinkProvider] || unlinkProvider} as a login method.
								You will no longer be able to sign in with this provider.
							</Dialog.Description>
						</Dialog.Header>
						<Dialog.Footer>
							{#if unlinkError}
								<div class="w-full space-y-3">
									<p class="text-sm text-destructive">{unlinkError}</p>
									<div class="flex justify-end gap-2">
										<Button variant="outline" onclick={() => { unlinkDialogOpen = false; unlinkError = ''; }}>Cancel</Button>
										<a
											href="/settings/users/{data.user?.userId}/edit"
											class={cn(buttonVariants({ variant: 'default' }))}
										>
											<Lock class="h-4 w-4 mr-2" />
											Set a Password
										</a>
									</div>
								</div>
							{:else}
								<Button variant="outline" onclick={() => { unlinkDialogOpen = false; unlinkError = ''; }}>Cancel</Button>
								<form
									method="POST"
									action="?/unlinkAccount"
									use:enhance={() => {
										isUnlinking = true;
										unlinkError = '';
										return async ({ result, update }) => {
											isUnlinking = false;
											if (result.type === 'success') {
												unlinkDialogOpen = false;
												await update();
											} else if (result.type === 'failure') {
												unlinkError = String(result.data?.error || 'Failed to unlink account');
											}
										};
									}}
								>
									<input type="hidden" name="provider" value={unlinkProvider} />
									<Button type="submit" variant="destructive" disabled={isUnlinking}>
										{#if isUnlinking}
											Unlinking...
										{:else}
											Yes, Unlink Account
										{/if}
									</Button>
								</form>
							{/if}
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			{:else}
				<div class="text-center py-8">
					<div
						class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4"
					>
						<Link2 class="h-8 w-8 text-muted-foreground/50" />
					</div>
					<h3 class="font-semibold mb-1">No Connected Accounts</h3>
					<p class="text-sm text-muted-foreground">
						You don't have any OAuth providers linked to your account.
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Account Actions Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<LogOut class="h-5 w-5" />
				Account Actions
			</Card.Title>
			<Card.Description>Sign out or manage your account</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<!-- Sign Out -->
			<div
				class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30"
			>
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-lg bg-muted shrink-0">
						<LogOut class="h-4 w-4 text-muted-foreground" />
					</div>
					<div>
						<p class="font-medium">Sign Out</p>
						<p class="text-sm text-muted-foreground">Sign out of your account on this device</p>
					</div>
				</div>
				<Button
					variant="outline"
					class="shrink-0 sm:w-auto w-full"
					onclick={handleSignOut}
					disabled={isSigningOut}
				>
					{#if isSigningOut}
						Signing out...
					{:else}
						Sign Out
					{/if}
				</Button>
			</div>

			<!-- Delete Account (hidden for admins) -->
			{#if !isAdmin}
				<div
					class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20"
				>
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-destructive/10 shrink-0">
							<Trash2 class="h-4 w-4 text-destructive" />
						</div>
						<div>
							<p class="font-medium text-destructive">Delete Account</p>
							<p class="text-sm text-muted-foreground">
								Permanently delete your account and all associated data
							</p>
						</div>
					</div>
					<Dialog.Root bind:open={deleteDialogOpen}>
						<Dialog.Trigger>
							<Button variant="destructive" class="shrink-0 sm:w-auto w-full">Delete Account</Button
							>
						</Dialog.Trigger>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title class="flex items-center gap-2">
									<AlertTriangle class="h-5 w-5 text-destructive" />
									Delete Account
								</Dialog.Title>
								<Dialog.Description>
									This action cannot be undone. This will permanently delete your account, remove
									you from all workspaces, and delete all your personal data.
								</Dialog.Description>
							</Dialog.Header>
							{#if deleteError}
								<p class="text-sm text-destructive">{deleteError}</p>
							{/if}
							<Dialog.Footer>
								<Button variant="outline" onclick={() => { deleteDialogOpen = false; deleteError = ''; }}>Cancel</Button>
								<form
									method="POST"
									action="?/deleteAccount"
									use:enhance={() => {
										isDeleting = true;
										deleteError = '';
										return async ({ result }) => {
											isDeleting = false;
											if (result.type === 'redirect') {
												window.location.href = result.location;
												return;
											} else if (result.type === 'failure') {
												deleteError = String(result.data?.error || 'Failed to delete account');
											}
										};
									}}
								>
									<Button type="submit" variant="destructive" disabled={isDeleting}>
										{#if isDeleting}
											Deleting...
										{:else}
											Yes, Delete My Account
										{/if}
									</Button>
								</form>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
