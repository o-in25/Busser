<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import {
		User,
		Mail,
		Shield,
		Eye,
		Plus,
		Pencil,
		Trash2,
		Check,
		X,
		ArrowRight,
		KeyRound,
		Building2,
		Users,
		Crown,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	export let data: PageData;

	const normalizePermissions = (permissions: string[]): Record<string, PermissionGrants> => {
		const validGrants = ['view', 'add', 'edit', 'delete'];

		const result: Record<string, PermissionGrants> = {};

		permissions.forEach(perm => {
			const [grant, ...resourceParts] = perm.split('_');
			const resource = resourceParts.join('_');

			if (!validGrants.includes(grant)) return;

			if (!result[resource]) {
				result[resource] = {
					view: false,
					add: false,
					edit: false,
					delete: false,
					resource,
				};
			}

			result[resource][grant as keyof Omit<PermissionGrants, 'resource'>] = true;
		});

		return result;
	};

	type PermissionGrants = {
		view: boolean;
		add: boolean;
		edit: boolean;
		delete: boolean;
		resource: string;
	};

	const permissions: string[] = getContext('permissions') || [];
	const roles: string[] = getContext('roles') || [];

	const tableEntry = normalizePermissions(permissions);

	// Format resource name for display
	const formatResource = (resource: string) => {
		return resource
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	// Permission config with colors and icons
	const permissionConfig = {
		view: { icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'View' },
		add: { icon: Plus, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Add' },
		edit: { icon: Pencil, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Edit' },
		delete: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Delete' },
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
			<p class="text-sm text-muted-foreground mt-1">
				View your account details and permissions
			</p>
		</div>
		<a
			class={cn(buttonVariants({ variant: "default" }))}
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
				<div class="space-y-2 sm:col-span-2">
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
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Permissions Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Shield class="h-5 w-5" />
				Permissions
			</Card.Title>
			<Card.Description>
				Your access rights across different resources
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if Object.keys(tableEntry).length > 0}
				<!-- Permission Legend -->
				<div class="flex flex-wrap gap-4 mb-6 pb-4 border-b">
					{#each Object.entries(permissionConfig) as [key, config]}
						{@const Icon = config.icon}
						<div class="flex items-center gap-1.5 text-sm">
							<div class="p-1 rounded {config.bg}">
								<Icon class="h-3.5 w-3.5 {config.color}" />
							</div>
							<span class="text-muted-foreground">{config.label}</span>
						</div>
					{/each}
				</div>

				<!-- Permissions Grid -->
				<div class="space-y-3">
					{#each Object.entries(tableEntry) as [_, grants]}
						<div class="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
							<div class="font-medium">
								{formatResource(grants.resource)}
							</div>
							<div class="flex items-center gap-2">
								{#each Object.entries(permissionConfig) as [key, config]}
									{@const Icon = config.icon}
									{@const hasPermission = grants[key as keyof typeof grants]}
									{#if hasPermission}
										<div
											class="p-2 rounded-lg {config.bg}"
											title="{config.label} access"
										>
											<Icon class="h-4 w-4 {config.color}" />
										</div>
									{:else}
										<div
											class="p-2 rounded-lg bg-muted/50 opacity-30"
											title="No {config.label.toLowerCase()} access"
										>
											<Icon class="h-4 w-4 text-muted-foreground" />
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8">
					<div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
						<Shield class="h-8 w-8 text-muted-foreground/50" />
					</div>
					<h3 class="font-semibold mb-1">No Permissions</h3>
					<p class="text-sm text-muted-foreground">
						You don't have any specific permissions assigned.
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Workspaces Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Building2 class="h-5 w-5" />
				Workspaces
			</Card.Title>
			<Card.Description>
				Collections you have access to
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.workspaces && data.workspaces.length > 0}
				<div class="space-y-3">
					{#each data.workspaces as workspace}
						<a
							href="/{workspace.workspaceId}/catalog"
							class="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
						>
							<div class="flex items-center gap-3">
								<div class="p-2 rounded-lg {workspace.workspaceType === 'personal' ? 'bg-blue-500/10' : 'bg-purple-500/10'}">
									{#if workspace.workspaceType === 'personal'}
										<User class="h-4 w-4 text-blue-500" />
									{:else}
										<Users class="h-4 w-4 text-purple-500" />
									{/if}
								</div>
								<div>
									<div class="font-medium">{workspace.workspaceName}</div>
									<div class="text-sm text-muted-foreground capitalize">{workspace.workspaceType}</div>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Badge variant="secondary" class="capitalize">
									{#if workspace.workspaceRole === 'owner'}
										<Crown class="h-3 w-3 mr-1" />
									{/if}
									{workspace.workspaceRole}
								</Badge>
								<ArrowRight class="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8">
					<div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
						<Building2 class="h-8 w-8 text-muted-foreground/50" />
					</div>
					<h3 class="font-semibold mb-1">No Workspaces</h3>
					<p class="text-sm text-muted-foreground">
						You don't belong to any workspaces yet.
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
