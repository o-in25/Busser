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
	export let action: 'add' | 'edit' | 'register' | 'login';
	export let roles: SelectOption[] = [];
	export let suppressToast = false;
	// const userRoles: any[] = getContext('roles') || [];
	const permissions: string[] = getContext('permissions');

	let selected = user?.roles.map(({ roleId }) => roleId);

	const actions = {
		edit: `/settings/users/${user?.userId}/edit`,
		add: '/settings/users/add',
		register: '/signup',
    login: '/login'
	};

	export let errors = {
		username: {
			hasError: false,
			message: '',
		},
		email: {
			hasError: false,
			message: '',
		},
		password: {
			hasError: false,
			message: '',
		},
		passwordConfirm: {
			hasError: false,
			message: '',
		},
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
				if (!suppressToast) {
					if (result.type === 'failure')
						$notificationStore.error = {
							message: result?.data?.error?.toString() || '',
						};
					if (result.type === 'success')
						$notificationStore.success = { message: 'User updated.' };
				}
			}
		};
	}}
>

  <!-- username -->
	<Label
		class="space-y-2"
		color={errors.username.hasError ? 'red' : 'gray'}
	>
		<span>Username</span>
		<Input
			type="text"
			name="username"
			color={errors.username.hasError ? 'red' : 'base'}
			value={user?.username || ''}
		/>
		{#if errors.username.hasError}
			<Helper
				class="mt-2"
				color="red"
			>
				<span class="font-medium">{errors.username.message}</span>
			</Helper>
		{/if}
	</Label>

  <!-- email -->
   {#if action !== 'login'}
	<Label
		class="space-y-2"
		color={errors.email.hasError ? 'red' : 'gray'}
	>
		<span>Email</span>
		<Input
			type="email"
			name="email"
			color={errors.email.hasError ? 'red' : 'base'}
			value={user?.email || ''}
		/>
		{#if errors.email.hasError}
			<Helper
				class="mt-2"
				color="red"
			>
				<span class="font-medium">{errors.email.message}</span>
			</Helper>
		{/if}
	</Label>
  {/if}

  <!-- role -->
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

  <!-- password reset -->
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
	{#if action === 'add' || action === 'register' || action === 'login'}
    <!-- password -->
		<Label
			class="space-y-2"
			color={errors.password.hasError ? 'red' : 'gray'}
		>
			<span>Password</span>
			<Input
				type="password"
				name="password"
				color={errors.password.hasError ? 'red' : 'base'}
			/>
			{#if errors.password.hasError}
				<Helper
					class="mt-2"
					color="red"
				>
					<span class="font-medium">{errors.password.message}</span>
				</Helper>
			{/if}
		</Label>

    <!-- password confirm -->
     {#if action !== 'login'}
		<Label
			class="space-y-2"
			color={errors.passwordConfirm.hasError ? 'red' : 'gray'}
		>
			<span>Confirm Password</span>
			<Input
				type="password"
				name="passwordConfirm"
				color={errors.passwordConfirm.hasError ? 'red' : 'base'}
			/>
			{#if errors.passwordConfirm.hasError}
				<Helper
					class="mt-2"
					color="red"
				>
					<span class="font-medium">{errors.passwordConfirm.message}</span>
				</Helper>
			{/if}
		</Label>
    {/if}
		<!-- {#if action === 'register'}
			<fieldset>
				<Label class="space-y-2">
					<span>Invite Code</span>
					<Input
						type="text"
						name="inviteCode"
						required
					/>
					<Helper class="text-sm text-gray-400">Registration is currently invite only.</Helper>
				</Label>
			</fieldset>
		{/if} -->
	{/if}

	{#if action === 'register' || action === 'login'}
		<GradientButton
			color="pinkToOrange"
			size="lg"
			class="w-full hover:!bg-transparent"
			type="submit"
		>
			{action === 'register'? 'Sign up' : 'Log in'}
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

  {#if action === 'register'}
	<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
		Already signed up? <a
			href="/login "
			class="text-primary-700 hover:underline dark:text-primary-500"
		>
			Log in
		</a>
	</div>
  {/if}

  {#if action === 'login'}
	<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
		Need to sign up? <a
			href="/signup "
			class="text-primary-700 hover:underline dark:text-primary-500"
		>
			Log in
		</a>
	</div>
  {/if}
</form>
