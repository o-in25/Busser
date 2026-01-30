<script lang="ts">
	import { getContext } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { SelectOption } from '$lib/types';
	import type { User } from '$lib/types/auth';

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

	const permissions: string[] = getContext('permissions');

	let selected = user?.roles.map(({ roleId }) => roleId) || [];

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

	function toggleRole(roleId: string) {
		if (selected.includes(roleId)) {
			selected = selected.filter((id) => id !== roleId);
		} else {
			selected = [...selected, roleId];
		}
	}
</script>

<!-- username -->
<div class="space-y-2">
	<Label for="username" class={errors?.username?.hasError ? 'text-destructive' : ''}>
		Username
	</Label>
	<Input
		type="text"
		id="username"
		name="username"
		class={errors?.username?.hasError ? 'border-destructive' : ''}
		value={user?.username || ''}
	/>
	{#if errors?.username.hasError}
		<Helper color="red">
			{errors?.username?.message}
		</Helper>
	{/if}
</div>

<!-- email -->
{#if action !== 'login'}
	<div class="space-y-2">
		<Label for="email" class={errors?.email?.hasError ? 'text-destructive' : ''}>Email</Label>
		<Input
			type="email"
			id="email"
			name="email"
			class={errors?.email?.hasError ? 'border-destructive' : ''}
			value={user?.email || ''}
		/>
		{#if errors?.email.hasError}
			<Helper color="red">
				{errors?.email.message}
			</Helper>
		{/if}
	</div>
{/if}

<!-- role -->
{#if action === 'edit' || action === 'add'}
	<div class="space-y-2">
		<Label>Role</Label>
		<input class="hidden" name="roles" id="roles" bind:value={selected} />
		<div class="flex flex-wrap gap-2">
			{#each roles as role}
				<button
					type="button"
					onclick={() => toggleRole(String(role.value))}
					disabled={!permissions.includes('edit_admin')}
					class="px-3 py-1.5 text-sm rounded-full border transition-colors
						{selected.includes(String(role.value))
						? 'bg-primary text-primary-foreground border-primary'
						: 'bg-background border-input hover:bg-accent'}"
				>
					{role.name}
				</button>
			{/each}
		</div>
	</div>
{/if}

<!-- password reset -->
{#if action === 'edit'}
	<div class="flex items-start">
		<a
			href="/settings/users/{user?.userId}/reset-password"
			class="text-sm text-primary hover:underline"
		>
			Reset Password...
		</a>
	</div>
{/if}

{#if action === 'add' || action === 'register' || action === 'login'}
	<!-- password -->
	<div class="space-y-2">
		<Label for="password" class={errors?.password?.hasError ? 'text-destructive' : ''}>
			Password
		</Label>
		<Input
			type="password"
			id="password"
			name="password"
			class={errors?.password?.hasError ? 'border-destructive' : ''}
			bind:value={password}
		/>
		{#if errors?.password.hasError}
			<Helper color="red">
				{errors?.password.message}
			</Helper>
		{/if}
		{#if action === 'login'}
			<div class="text-left">
				<a
					href="/forgot-password"
					class="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
				>
					Forgot your password?
				</a>
			</div>
		{/if}
	</div>

	<!-- password confirm -->
	{#if action !== 'login'}
		<div class="space-y-2">
			<Label
				for="passwordConfirm"
				class={errors?.passwordConfirm?.hasError ? 'text-destructive' : ''}
			>
				Confirm Password
			</Label>
			<Input
				type="password"
				id="passwordConfirm"
				name="passwordConfirm"
				class={errors?.passwordConfirm?.hasError ? 'border-destructive' : ''}
				bind:value={passwordConfirm}
			/>
			{#if errors?.passwordConfirm.hasError}
				<Helper color="red">
					{errors?.passwordConfirm.message}
				</Helper>
			{/if}
		</div>
	{/if}

	{#if action === 'register'}
		<fieldset>
			<!-- invitation code -->
			<div class="space-y-2">
				<Label
					for="invitationCode"
					class={errors?.invitationCode?.hasError ? 'text-destructive' : ''}
				>
					Invite Code
				</Label>
				<Input
					type="text"
					id="invitationCode"
					name="invitationCode"
					class={errors?.invitationCode?.hasError ? 'border-destructive' : ''}
					bind:value={invitationCode}
				/>
				{#if errors?.invitationCode.hasError}
					<Helper color="red">
						{errors?.invitationCode.message}
					</Helper>
				{:else}
					<Helper>Registration is currently invite only.</Helper>
				{/if}
			</div>
		</fieldset>
	{/if}
{/if}

<!-- submit -->
{#if action === 'register' || action === 'login'}
	<Button
		type="submit"
		size="lg"
		class="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500"
	>
		{action === 'register' ? 'Sign up' : 'Log in'}
	</Button>
{:else}
	<div class="md:flex justify-end">
		<Button class="w-full md:w-32" type="submit" size="lg">Save</Button>
	</div>
{/if}

<!-- help -->
{#if action === 'register'}
	<div class="text-sm font-medium text-muted-foreground">
		Already signed up? <a href="/login" class="text-primary hover:underline"> Log in </a>
	</div>
{/if}

{#if action === 'login'}
	<div class="text-sm font-medium text-muted-foreground">
		Not a member? <a href="/signup" class="text-primary hover:underline"> Sign up </a>
	</div>
{/if}
