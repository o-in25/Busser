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

	export let user: User | null = null;
	export let action: 'add' | 'edit' | 'register' | 'login';
	export let roles: SelectOption[] = [];

	export let password = '';
	export let passwordConfirm = '';
	export let invitationCode = '';

	export const clearSensitiveFields = () => {
		password = '';
		passwordConfirm = '';
	};

	// const userRoles: any[] = getContext('roles') || [];
	const permissions: string[] = getContext('permissions');

	let selected = user?.roles.map(({ roleId }) => roleId);

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
		invitationCode: {
			hasError: false,
			message: '',
		},
	};
</script>

<!-- username -->
<Label
	class="space-y-2"
	color={errors?.username?.hasError ? 'red' : 'gray'}
>
	<span>Username</span>
	<Input
		type="text"
		name="username"
		color={errors?.username?.hasError ? 'red' : 'base'}
		value={user?.username || ''}
	/>
	{#if errors?.username.hasError}
		<Helper
			class="mt-2"
			color="red"
		>
			<span class="font-medium">{errors?.username?.message}</span>
		</Helper>
	{/if}
</Label>

<!-- email -->
{#if action !== 'login'}
	<Label
		class="space-y-2"
		color={errors?.email.hasError ? 'red' : 'gray'}
	>
		<span>Email</span>
		<Input
			type="email"
			name="email"
			color={errors?.email.hasError ? 'red' : 'base'}
			value={user?.email || ''}
		/>
		{#if errors?.email.hasError}
			<Helper
				class="mt-2"
				color="red"
			>
				<span class="font-medium">{errors?.email.message}</span>
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
		color={errors?.password.hasError ? 'red' : 'gray'}
	>
		<span>Password</span>
		<Input
			type="password"
			name="password"
			color={errors?.password.hasError ? 'red' : 'base'}
			bind:value={password}
		/>
		{#if errors?.password.hasError}
			<Helper
				class="mt-2"
				color="red"
			>
				<span class="font-medium">{errors?.password.message}</span>
			</Helper>
		{/if}
	</Label>

	<!-- password confirm -->
	{#if action !== 'login'}
		<Label
			class="space-y-2"
			color={errors?.passwordConfirm.hasError ? 'red' : 'gray'}
		>
			<span>Confirm Password</span>
			<Input
				type="password"
				name="passwordConfirm"
				color={errors?.passwordConfirm.hasError ? 'red' : 'base'}
				bind:value={passwordConfirm}
			/>
			{#if errors?.passwordConfirm.hasError}
				<Helper
					class="mt-2"
					color="red"
				>
					<span class="font-medium">{errors?.passwordConfirm.message}</span>
				</Helper>
			{/if}
		</Label>
	{/if}
	{#if action === 'register'}
		<fieldset>
			<!-- invitation code -->
			<Label
				class="space-y-2"
				color={errors?.invitationCode.hasError ? 'red' : 'gray'}
			>
				<span>Invite Code</span>
				<Input
					type="text"
					name="invitationCode"
					color={errors?.invitationCode.hasError ? 'red' : 'base'}
					bind:value={invitationCode}
				/>
				{#if errors?.invitationCode.hasError}
					<Helper
						class="mt-2"
						color="red"
					>
						<span class="font-medium">{errors?.invitationCode.message}</span>
					</Helper>
				{:else}
					<Helper class="text-sm text-gray-400">
						Registration is currently invite only.
					</Helper>
				{/if}
			</Label>
		</fieldset>
	{/if}
{/if}

<!-- submit -->
{#if action === 'register' || action === 'login'}
	<GradientButton
		color="pinkToOrange"
		size="lg"
		class="w-full hover:!bg-transparent"
		type="submit"
	>
		{action === 'register' ? 'Sign up' : 'Log in'}
	</GradientButton>
{:else}
	<div class="md:flex justify-end">
		<Button
			class="w-full md:w-32"
			type="submit"
			size="xl"
		>
			Save
		</Button>
	</div>
{/if}

<!-- help -->
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
		Not a member? <a
			href="/signup "
			class="text-primary-700 hover:underline dark:text-primary-500"
		>
			Sign up
		</a>
	</div>
{/if}
