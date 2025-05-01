<script lang="ts">
	import type { User } from '$lib/types/auth';
	import {
		Button,
		GradientButton,
		Helper,
		Input,
		Label,
		MultiSelect,
	} from 'flowbite-svelte';
	import type { SelectOption } from '$lib/types';
	import { getContext } from 'svelte';
	import { applyAction, enhance } from '$app/forms';
	import { notificationStore } from '../../stores';
	import { goto } from '$app/navigation';

	export let user: User | null = null;
	export let action: 'add' | 'edit' | 'register';
	export let roles: SelectOption[] = [];
	// const userRoles: any[] = getContext('roles') || [];
	const permissions: string[] = getContext('permissions');

	let selected = user?.roles.map(({ roleId }) => roleId);

	const actions = {
		edit: `/settings/users/${user?.userId}/edit`,
		add: '/settings/users/add',
		register: '/signup',
	};
</script>

<form
	class="space-y-6"
	method="POST"
	action={actions[action]}
	use:enhance={() => {
		return async ({ result }) => {
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
			required
			value={user?.username || ''}
		/>
	</Label>
	<Label class="space-y-2">
		<span>Email</span>
		<Input
			type="email"
			name="email"
			required
			value={user?.email || ''}
		/>
	</Label>
	{#if action === 'edit' || action === 'add'}
		<Label class="space-y-2">
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
				disabled={!permissions.includes('edit_admin')}
			/>
		</Label>
	{/if}

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
	{#if action === 'add' || action === 'register'}
		<Label class="space-y-2">
			<span>Password</span>
			<Input
				type="password"
				name="password"
				required
			/>
		</Label>
		<Label class="space-y-2">
			<span>Confirm Password</span>
			<Input
				type="password"
				name="passwordConfirm"
				required
			/>
		</Label>
		{#if action === 'register'}
			<fieldset>
				<Label class="space-y-2">
					<span>Invite Code</span>
					<Input
						type="text"
						name="inviteCode"
						required
					/>
					<Helper class="text-sm text-gray-400">Registration is invite only.</Helper>
				</Label>
			</fieldset>
		{/if}
	{/if}

	{#if action === 'register'}
		<GradientButton
			color="pinkToOrange"
			size="lg"
			class="w-full hover:!bg-transparent"
			type="submit"
		>
			Sign up
		</GradientButton>
	{:else}
		<Button
			class="w-full"
			type="submit"
			size="lg"
		>
			Save
		</Button>
	{/if}
	<!-- submit -->

	<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
		Already registered? <a
			href="/login "
			class="text-primary-700 hover:underline dark:text-primary-500"
		>
			Log in
		</a>
	</div>
</form>
