<script lang="ts">
	import type { PageData } from './$types';
	import UserTable from '$lib/components/UserTable.svelte';
	import * as Card from '$lib/components/ui/card';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { Users, UserPlus } from 'lucide-svelte';
	import type { User } from '$lib/types/auth';

	export let data: PageData;
	let currentUser = data?.user || ({} as User);

	// Count of users
	$: userCount = data?.args?.length || 0;
</script>

<svelte:head>
	<title>Users - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">User Management</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Manage user accounts and access
			</p>
		</div>
		<a class={cn(buttonVariants({ variant: "default" }))} href="/settings/users/add">
			<UserPlus class="h-4 w-4 mr-2" />
			Add User
		</a>
	</div>

	<!-- Users Card -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title class="flex items-center gap-2">
						<Users class="h-5 w-5" />
						Users
					</Card.Title>
					<Card.Description>
						{userCount} user{userCount !== 1 ? 's' : ''} in the system
					</Card.Description>
				</div>
				<Badge variant="secondary" class="text-sm">
					{userCount}
				</Badge>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			<UserTable
				users={data?.args}
				{currentUser}
			/>
		</Card.Content>
	</Card.Root>
</div>
