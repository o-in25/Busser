<script lang="ts">
	import type { User } from '$lib/types/auth';
	import { Button, Input, Label, MultiSelect } from 'flowbite-svelte';
	import type { SelectOption } from '$lib/types';
	import { getContext } from 'svelte';
	import { applyAction, enhance } from '$app/forms';
	import { notificationStore } from '../../stores';
	import { goto } from '$app/navigation';

	export let user: User | null = null;
	export let action: String;
	export let roles: SelectOption[];
	// const userRoles: any[] = getContext('roles') || [];
	const permissions: string[] = getContext('permissions');

	let selected = user?.roles.map(({ roleId }) => roleId);
</script>

<form
	class="space-y-6"
	method="POST"
	action={action === 'edit'
		? `/settings/users/${user?.userId}/edit`
		: '/settings/users/add'}
	use:enhance={() => {
		return async ({ result }) => {
			console.log(result);
			if (result.type === 'redirect') {
				goto(result.location);
			} else {
				await applyAction(result);
				if (result.type === 'failure')
					$notificationStore.error = {
						message: result?.data?.error?.toString() || '',
					};
				if (result.type === 'success')
					$notificationStore.success = { message: 'User updated.' };
			}
		};
	}}
>
	<Label class="space-y-2">
		<span>Username</span>
		<Input
			type="text"
			name="username"
			placeholder="username"
			required
			value={user?.username || ''}
		/>
	</Label>
	<Label class="space-y-2">
		<span>Email</span>
		<Input
			type="email"
			name="email"
			placeholder="name@company.com"
			required
			value={user?.email || ''}
		/>
	</Label>
	<Label class="space-y-2">
		{#if permissions.includes('edit_admin')}
			<span>Role</span>
			<input
				class="hidden"
				name="roles"
				id="roles"
				bind:value={selected}
			/>
			<MultiSelect
				items={roles}
				bind:value={selected}
			/>
		{/if}
	</Label>

	{#if action === 'edit'}
		<div class="flex items-start">
			<a
				href="/settings/users/{user?.userId}/reset-password"
				class="text-sm text-primary-700 hover:underline dark:text-primary-500"
			>
				Reset Password...
			</a>
		</div>
	{/if}
	{#if action === 'add'}
		<Label class="space-y-2">
			<span>Password</span>
			<Input
				type="password"
				name="password"
				placeholder="•••••"
				required
			/>
		</Label>
		<Label class="space-y-2">
			<span>Confirm Password</span>
			<Input
				type="password"
				name="passwordConfirm"
				placeholder="•••••"
				required
			/>
		</Label>
	{/if}
	<!-- submit -->
	<div class="md:flex justify-end">
		<div class="my-4 md:mr-4 order-2">
			<Button
				class="w-full md:w-32"
				type="submit"
				size="xl"
			>
				Save
			</Button>
		</div>
	</div>
</form>
