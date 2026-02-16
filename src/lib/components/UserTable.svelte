<script lang="ts">
	import { AlertCircle, CheckCircle2, Eye, Mail, Pencil, Trash2, User, UserPlus } from 'lucide-svelte';
	import moment from 'moment';

	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import type { User as UserType } from '$lib/types/auth';
	import { cn } from '$lib/utils';

	// props
	export let users: UserType[];
	export let currentUser: UserType | null;

	let target: string | undefined = undefined;
	let isOpened = false;
	let result: any = {};

	const deleteUser = async (userId: string): Promise<any> => {
		let response = await fetch(`/api/user/${userId}/delete`, {
			method: 'DELETE',
		});
		response = await response.json();
		return response;
	};

	// Get initials for avatar
	const getInitials = (username: string) => {
		return username
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	// Check if user was active recently (within last 7 days)
	const isRecentlyActive = (lastActivity: string | Date | null | undefined) => {
		if (!lastActivity) return false;
		return moment().diff(moment(lastActivity), 'days') < 7;
	};

	// Format relative time
	const formatRelativeTime = (date: string | Date | null | undefined) => {
		if (!date) return 'Never';
		return moment(date).fromNow();
	};

	// Get target user for delete dialog
	$: targetUser = users?.find(({ userId }) => target === userId);
</script>

{#if result.error || result.success}
	<Alert variant={result.error ? 'destructive' : 'default'} class="mx-6 mt-4">
		{#if result.error}
			<AlertCircle class="h-4 w-4" />
		{:else}
			<CheckCircle2 class="h-4 w-4" />
		{/if}
		<AlertDescription>{result.error || result.success}</AlertDescription>
	</Alert>
{/if}

{#if users && users.length > 0}
	<div class="overflow-x-auto">
		<Table.Root>
			<Table.Header>
				<Table.Row class="hover:bg-transparent">
					<Table.Head class="pl-6">User</Table.Head>
					<Table.Head class="hidden sm:table-cell">Email</Table.Head>
					<Table.Head class="hidden lg:table-cell">Joined</Table.Head>
					<Table.Head class="hidden md:table-cell">Last Activity</Table.Head>
					<Table.Head class="text-right pr-6">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each users as user (user.userId)}
					<Table.Row class="group">
						<Table.Cell class="pl-6">
							<div class="flex items-center gap-3">
								<!-- Avatar -->
								<div
									class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
								>
									<span class="text-sm font-semibold text-primary">
										{getInitials(user.username)}
									</span>
								</div>
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<p class="font-medium truncate">{user.username}</p>
										{#if user.userId === currentUser?.userId}
											<Badge variant="secondary" class="text-xs">You</Badge>
										{/if}
									</div>
									<p class="text-sm text-muted-foreground truncate sm:hidden">
										{user.email}
									</p>
								</div>
							</div>
						</Table.Cell>
						<Table.Cell class="hidden sm:table-cell">
							<div class="flex items-center gap-2 text-muted-foreground">
								<Mail class="h-4 w-4 shrink-0" />
								<span class="truncate">{user.email}</span>
							</div>
						</Table.Cell>
						<Table.Cell class="hidden lg:table-cell">
							<span class="text-sm text-muted-foreground">
								{formatRelativeTime(user.createdDate)}
							</span>
						</Table.Cell>
						<Table.Cell class="hidden md:table-cell">
							<div class="flex items-center gap-2">
								{#if isRecentlyActive(user.lastActivityDate)}
									<div class="w-2 h-2 rounded-full bg-green-500"></div>
								{:else}
									<div class="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
								{/if}
								<span class="text-sm text-muted-foreground">
									{formatRelativeTime(user.lastActivityDate)}
								</span>
							</div>
						</Table.Cell>
						<Table.Cell class="text-right pr-6">
							<div class="flex items-center justify-end gap-2">
								<a
									class={cn(
										buttonVariants({ variant: 'outline', size: 'icon' }),
										'h-8 w-8 bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-white'
									)}
									href="/settings/users/{user.userId}"
									title="View user"
								>
									<Eye class="w-4 h-4" />
								</a>
								<a
									class={cn(
										buttonVariants({ variant: 'outline', size: 'icon' }),
										'h-8 w-8 bg-violet-500/20 border-violet-500/50 text-violet-400 hover:bg-violet-500 hover:text-white'
									)}
									href="/settings/users/{user.userId}/edit"
									title="Edit user"
								>
									<Pencil class="w-4 h-4" />
								</a>

								{#if user.userId !== currentUser?.userId}
									<Button
										variant="outline"
										size="icon"
										class="h-8 w-8 bg-destructive/20 border-destructive/50 text-red-400 hover:bg-destructive hover:text-destructive-foreground"
										onclick={() => {
											isOpened = true;
											target = user.userId;
										}}
										title="Delete user"
									>
										<Trash2 class="w-4 h-4" />
									</Button>
								{/if}
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{:else}
	<!-- Empty State -->
	<div class="flex flex-col items-center justify-center py-16 text-center px-6">
		<div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
			<User class="h-8 w-8 text-muted-foreground/50" />
		</div>
		<h3 class="font-semibold mb-1">No Users</h3>
		<p class="text-sm text-muted-foreground mb-4">There are no users in the system yet.</p>
		<a class={cn(buttonVariants({ variant: 'default' }))} href="/settings/users/add">
			<UserPlus class="h-4 w-4 mr-2" />
			Add First User
		</a>
	</div>
{/if}

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={isOpened}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<AlertCircle class="h-5 w-5 text-destructive" />
				Delete User
			</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this user? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			{#if targetUser}
				<div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
					<div
						class="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0"
					>
						<span class="text-sm font-semibold text-destructive">
							{getInitials(targetUser.username)}
						</span>
					</div>
					<div>
						<p class="font-medium">{targetUser.username}</p>
						<p class="text-sm text-muted-foreground">{targetUser.email}</p>
					</div>
				</div>
			{/if}
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (target = undefined)}>Cancel</Button>
			<Button
				variant="destructive"
				onclick={async () => {
					if (target) {
						let { success, error, refresh } = await deleteUser(target);
						result = { success, error };
						users = refresh;
					}
					target = undefined;
					isOpened = false;
				}}
			>
				<Trash2 class="h-4 w-4 mr-2" />
				Delete User
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
