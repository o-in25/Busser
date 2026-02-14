<script lang="ts">
	import {
		ArrowLeft,
		BookOpen,
		CheckCircle2,
		Clock,
		Mail,
		Package,
		Pencil,
		Shield,
		User,
		XCircle,
	} from 'lucide-svelte';
	import moment from 'moment';

	import { Badge } from '$lib/components/ui/badge';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';

	export let data: PageData;

	$: user = data.viewUser;
	$: workspaces = data.workspaces || [];

	const getInitials = (username: string) => {
		return username
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	const formatDate = (date: string | Date | null | undefined) => {
		if (!date) return 'Never';
		return moment(date).format('MMM D, YYYY [at] h:mm A');
	};

	const formatRelative = (date: string | Date | null | undefined) => {
		if (!date) return 'Never';
		return moment(date).fromNow();
	};
</script>

<svelte:head>
	<title>{user?.username || 'User'} - Busser</title>
</svelte:head>

<Breadcrumb name="Users" href="/settings/users">
	<BreadcrumbItem name={user?.username || 'User'}></BreadcrumbItem>
</Breadcrumb>

{#if user}
	<div class="space-y-6 mt-3">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<div class="relative">
					<div
						class="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center"
					>
						{#if user.avatarImageUrl}
							<img
								src={user.avatarImageUrl}
								alt={user.username}
								class="w-full h-full object-cover"
							/>
						{:else}
							<span class="text-xl font-bold text-primary">
								{getInitials(user.username)}
							</span>
						{/if}
					</div>
					{#if user.verified === 1}
						<div
							class="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5"
							title="Verified"
						>
							<CheckCircle2 class="w-3.5 h-3.5 text-white" />
						</div>
					{/if}
				</div>
				<div>
					<h1 class="text-2xl font-bold">{user.username}</h1>
					<div class="flex items-center gap-2 text-muted-foreground">
						<Mail class="h-4 w-4" />
						<span class="text-sm">{user.email}</span>
					</div>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<a
					class={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
					href="/settings/users"
				>
					<ArrowLeft class="h-4 w-4 mr-2" />
					Back
				</a>
				<a
					class={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
					href="/settings/users/{user.userId}/edit"
				>
					<Pencil class="h-4 w-4 mr-2" />
					Edit User
				</a>
			</div>
		</div>

		<!-- Account Info Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<User class="h-5 w-5" />
					Account Information
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4 sm:grid-cols-3">
					<div class="p-4 rounded-lg bg-muted/30">
						<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
							{#if user.verified === 1}
								<CheckCircle2 class="h-4 w-4 text-green-500" />
							{:else}
								<XCircle class="h-4 w-4 text-destructive" />
							{/if}
							Verification
						</div>
						<p class="font-semibold">
							{user.verified === 1 ? 'Verified' : 'Unverified'}
						</p>
					</div>
					<div class="p-4 rounded-lg bg-muted/30">
						<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
							<Clock class="h-4 w-4" />
							Last Activity
						</div>
						<p class="font-semibold">{formatRelative(user.lastActivityDate)}</p>
						{#if user.lastActivityDate}
							<p class="text-xs text-muted-foreground mt-0.5">
								{formatDate(user.lastActivityDate)}
							</p>
						{/if}
					</div>
					<div class="p-4 rounded-lg bg-muted/30">
						<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
							<Shield class="h-4 w-4" />
							Roles
						</div>
						<div class="flex flex-wrap gap-1 mt-1">
							{#if user.roles?.length}
								{#each user.roles as role}
									<Badge variant="secondary">{role.roleName}</Badge>
								{/each}
							{:else}
								<span class="text-sm text-muted-foreground">No roles assigned</span>
							{/if}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Workspaces Card -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="flex items-center gap-2">
							<Package class="h-5 w-5" />
							Workspaces
						</Card.Title>
						<Card.Description>
							{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
						</Card.Description>
					</div>
					<Badge variant="secondary">{workspaces.length}</Badge>
				</div>
			</Card.Header>
			<Card.Content class="p-0">
				{#if workspaces.length > 0}
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row class="hover:bg-transparent">
									<Table.Head class="pl-6">Name</Table.Head>
									<Table.Head>Type</Table.Head>
									<Table.Head>Role</Table.Head>
									<Table.Head class="text-right">
										<BookOpen class="h-4 w-4 inline mr-1" />
										Recipes
									</Table.Head>
									<Table.Head class="text-right pr-6">
										<Package class="h-4 w-4 inline mr-1" />
										Products
									</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each workspaces as ws}
									<Table.Row>
										<Table.Cell class="pl-6 font-medium">
											{ws.workspaceName}
										</Table.Cell>
										<Table.Cell>
											<Badge variant="outline">
												{ws.workspaceType}
											</Badge>
										</Table.Cell>
										<Table.Cell>
											<Badge
												variant={ws.workspaceRole === 'owner'
													? 'default'
													: 'secondary'}
											>
												{ws.workspaceRole}
											</Badge>
										</Table.Cell>
										<Table.Cell class="text-right">
											{ws.recipeCount}
										</Table.Cell>
										<Table.Cell class="text-right pr-6">
											{ws.productCount}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{:else}
					<div class="py-8 text-center text-muted-foreground">
						<p class="text-sm">This user is not a member of any workspaces.</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{/if}
