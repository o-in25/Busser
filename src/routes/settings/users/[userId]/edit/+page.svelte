<script lang="ts">
	import { getContext } from 'svelte';
	import { Circle, CircleCheck, KeyRound, Lock, User } from 'lucide-svelte';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { CollapsibleSection } from '$lib/components/ui/collapsible';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import BackButton from '$lib/components/BackButton.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import { Helper } from '$lib/components/ui/helper';
	import { notificationStore } from '../../../../../stores';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let errors = $derived(form?.errors);
	const permissions: string[] = getContext('permissions') || [];
	const isAdmin = permissions.includes('edit_admin');

	let selected = data.user?.roles.map(({ roleId }) => roleId) || [];
	let selectedRole = $state(selected.length ? String(selected[0]) : '');

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	let emailTouched = $state(false);
	let emailValue = $state(data.user?.email || '');
	let emailInvalid = $derived(emailTouched && emailValue.length > 0 && !emailRegex.test(emailValue));

	const isSelf = data.isSelf;
	const needsOldPassword = isSelf && data.hasPassword;

	// password section
	let passwordOpen = $state(false);
	let passwordError = $state('');
	let isSubmittingPassword = $state(false);
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordTouched = $state(false);
	let confirmTouched = $state(false);

	const rules = [
		{ label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
		{ label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
		{ label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
		{ label: 'One number', test: (pw: string) => /\d/.test(pw) },
		{ label: 'One special character', test: (pw: string) => /[!@#$%^&*(),.?":{}|<>\-_=+\\[\]\/`~;']/.test(pw) },
	];

	let ruleResults = $derived(rules.map((rule) => ({ ...rule, met: rule.test(newPassword) })));
	let allRulesMet = $derived(ruleResults.every((r) => r.met));
	let passwordsMatch = $derived(newPassword === confirmPassword && newPassword.length > 0);
	let passwordMismatch = $derived(confirmTouched && confirmPassword.length > 0 && newPassword !== confirmPassword);

	function handleRoleChange(value: string | undefined) {
		selectedRole = value || '';
	}

	function resetPasswordFields() {
		newPassword = '';
		confirmPassword = '';
		passwordError = '';
		passwordTouched = false;
		confirmTouched = false;
	}
</script>

<svelte:head>
	<title>Edit User - Busser</title>
</svelte:head>

{#if isAdmin}
	<Breadcrumb name="Users" href="/settings/users">
		<BreadcrumbItem name="Edit User"></BreadcrumbItem>
	</Breadcrumb>
{/if}

<div class="space-y-6 mt-3">
	<!-- header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Edit User</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Update account details for {data.user?.username || 'this user'}
			</p>
		</div>
		<BackButton
			fallback={isAdmin ? `/settings/users/${data.user?.userId}` : '/settings/user-account'}
			label="Back"
			variant="outline"
			size="sm"
		/>
	</div>

	<form
		class="space-y-6"
		method="POST"
		action="?/updateUser"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect') {
					goto(result.location);
				} else {
					await applyAction(result);
					if (result.type === 'failure') {
						const msg = result?.data?.error?.toString() || '';
						if (msg) $notificationStore.error = { message: msg };
					} else if (result.type === 'error') {
						$notificationStore.error = { message: 'Something went wrong. Please try again.' };
					} else if (result.type === 'success') {
						$notificationStore.success = { message: 'User updated.' };
					}
				}
			};
		}}
	>
		<!-- user info card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<User class="h-5 w-5" />
					User Information
				</Card.Title>
				<Card.Description>Basic account details</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="username" class={errors?.username?.hasError ? 'text-destructive' : ''}>
						Username <span class="text-destructive">*</span>
					</Label>
					<Input
						type="text"
						id="username"
						name="username"
						required
						class={errors?.username?.hasError ? 'border-destructive' : ''}
						value={data.user?.username || ''}
					/>
					{#if errors?.username?.hasError}
						<Helper color="red">{errors.username.message}</Helper>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="email" class={errors?.email?.hasError || emailInvalid ? 'text-destructive' : ''}>
						Email <span class="text-destructive">*</span>
					</Label>
					<Input
						type="email"
						id="email"
						name="email"
						required
						class={errors?.email?.hasError || emailInvalid ? 'border-destructive' : ''}
						bind:value={emailValue}
						onblur={() => (emailTouched = true)}
					/>
					{#if errors?.email?.hasError}
						<Helper color="red">{errors.email.message}</Helper>
					{:else if emailInvalid}
						<Helper color="red">Please enter a valid email address.</Helper>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- roles card (admin only) -->
		{#if isAdmin && data.roles?.length && data.user?.userId !== data.currentUser}
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<KeyRound class="h-5 w-5" />
						Roles
					</Card.Title>
					<Card.Description>Assign system roles to this user</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-2">
						<Label>Role <span class="text-destructive">*</span></Label>
						<input class="hidden" name="roles" id="roles" bind:value={selectedRole} />
						<Select.Root type="single" value={selectedRole} onValueChange={handleRoleChange}>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Select a role...">
									{#if selectedRole}
										{data.roles.find((r) => String(r.value) === selectedRole)?.name}
									{/if}
								</Select.Value>
							</Select.Trigger>
							<Select.Content>
								{#each data.roles as role}
									<Select.Item value={String(role.value)} label={role.name} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- save button -->
		<div class="flex justify-end">
			<Button type="submit" class="w-full sm:w-auto">
				Save
			</Button>
		</div>
	</form>

	<!-- password section -->
	{#if isSelf || isAdmin}
		<CollapsibleSection
			title={data.hasPassword ? 'Change Password' : 'Set Password'}
			icon={Lock}
			bind:open={passwordOpen}
		>
			<form
				method="POST"
				action="?/resetPassword"
				class="space-y-4"
				use:enhance={() => {
					isSubmittingPassword = true;
					passwordError = '';
					return async ({ result }) => {
						isSubmittingPassword = false;
						if (result.type === 'success') {
							resetPasswordFields();
							passwordOpen = false;
							$notificationStore.success = {
								message: data.hasPassword ? 'Password changed.' : 'Password set.',
							};
						} else if (result.type === 'failure') {
							passwordError = result.data?.error?.toString() || 'Failed to update password.';
						} else if (result.type === 'error') {
							$notificationStore.error = { message: 'Something went wrong. Please try again.' };
						}
					};
				}}
			>
				{#if needsOldPassword}
					<div class="space-y-2">
						<Label for="oldPassword">
							Current Password <span class="text-destructive">*</span>
						</Label>
						<Input
							type="password"
							id="oldPassword"
							name="oldPassword"
							required
						/>
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="newPassword">
						New Password <span class="text-destructive">*</span>
					</Label>
					<Input
						type="password"
						id="newPassword"
						name="newPassword"
						required
						bind:value={newPassword}
						oninput={() => (passwordTouched = true)}
					/>
					{#if passwordTouched}
						<div class="rounded-lg bg-muted/30 p-3 space-y-1.5">
							{#each ruleResults as rule}
								<div class="flex items-center gap-2 text-sm">
									{#if rule.met}
										<CircleCheck class="h-4 w-4 text-neon-green-500 shrink-0" />
										<span class="text-neon-green-600 dark:text-neon-green-400">{rule.label}</span>
									{:else}
										<Circle class="h-4 w-4 text-muted-foreground shrink-0" />
										<span class="text-muted-foreground">{rule.label}</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="confirmPassword" class={passwordMismatch ? 'text-destructive' : ''}>
						Confirm Password <span class="text-destructive">*</span>
					</Label>
					<Input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						required
						class={passwordMismatch ? 'border-destructive' : ''}
						bind:value={confirmPassword}
						onblur={() => (confirmTouched = true)}
					/>
					{#if passwordMismatch}
						<Helper color="red">Passwords do not match.</Helper>
					{/if}
				</div>

				{#if passwordError}
					<p class="text-sm text-destructive">{passwordError}</p>
				{/if}

				<div class="flex justify-end gap-2">
					<Button
						variant="outline"
						type="button"
						onclick={() => { passwordOpen = false; resetPasswordFields(); }}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={isSubmittingPassword || !allRulesMet || !passwordsMatch}
					>
						{#if isSubmittingPassword}
							Saving...
						{:else if data.hasPassword}
							Change Password
						{:else}
							Set Password
						{/if}
					</Button>
				</div>
			</form>
		</CollapsibleSection>
	{/if}
</div>
