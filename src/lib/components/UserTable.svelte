<script lang="ts">
	import { Info, UserPlus, UserPen, UserMinus } from 'lucide-svelte';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import moment from 'moment';
	import type { User } from '$lib/types/auth';

	// props
	export let users: User[];
	export let currentUser: User | null;

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
</script>

{#if result.error || result.success}
	<Alert variant={result.error ? 'destructive' : 'default'} class="mb-4">
		<Info class="h-4 w-4" />
		<AlertDescription>{result.error || result.success}</AlertDescription>
	</Alert>
{/if}

<div class="glass-table overflow-x-auto">
	<Table.Root>
		<Table.Header class="glass-table-header">
			<Table.Row>
				<Table.Head>Username</Table.Head>
				<Table.Head>Email</Table.Head>
				<Table.Head>Last Activity</Table.Head>
				<Table.Head class="text-right">
					<a class={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/settings/users/add">
						<UserPlus class="w-4 h-4" />
					</a>
				</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each users as user (user.userId)}
				<Table.Row class="glass-table-row">
					<Table.Cell>{user.username}</Table.Cell>
					<Table.Cell>{user.email}</Table.Cell>
					<Table.Cell>
						{user.lastActivityDate
							? moment(user.lastActivityDate).format('DD-MMM-YYYY HH:mm:ss')
							: 'Never'}
					</Table.Cell>
					<Table.Cell class="text-right">
						<div class="inline-flex gap-1">
							<a class={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/settings/users/{user.userId}/edit">
								<UserPen class="w-4 h-4" />
							</a>

							{#if user.userId !== currentUser?.userId}
								<Button
									variant="outline"
									size="sm"
									onclick={() => {
										isOpened = true;
										target = user.userId;
									}}
								>
									<UserMinus class="w-4 h-4" />
								</Button>
							{/if}
						</div>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<Dialog.Root bind:open={isOpened}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete User</Dialog.Title>
			<Dialog.Description>
				Delete user <span class="font-semibold">
					{users.find(({ userId }) => target === userId)?.username}
				</span>?
				<p class="text-red-700 dark:text-red-500 font-bold mt-2">
					Once deleted, this user can't be recovered.
				</p>
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (target = undefined)}>
				Cancel
			</Button>
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
				Delete User
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
