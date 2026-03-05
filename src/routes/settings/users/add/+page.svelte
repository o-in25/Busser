<script lang="ts">
	import { getContext } from 'svelte';
	import { Circle, CircleCheck, KeyRound, Lock, User, UserPlus } from 'lucide-svelte';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import BackButton from '$lib/components/BackButton.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import { Helper } from '$lib/components/ui/helper';

	import { notificationStore } from '../../../../stores';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let errors = $derived(form?.errors);
	const permissions: string[] = getContext('permissions') || [];
	const isAdmin = permissions.includes('edit_admin');

	let selectedRole = $state('');

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	let emailTouched = $state(false);
	let emailValue = $state('');
	let emailInvalid = $derived(emailTouched && emailValue.length > 0 && !emailRegex.test(emailValue));

	let password = $state('');
	let passwordConfirm = $state('');
	let passwordTouched = $state(false);
	let passwordConfirmTouched = $state(false);

	const rules = [
		{ label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
		{ label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
		{ label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
		{ label: 'One number', test: (pw: string) => /\d/.test(pw) },
		{ label: 'One special character', test: (pw: string) => /[!@#$%^&*(),.?":{}|<>\-_=+\\[\]\/`~;']/.test(pw) },
	];

	let ruleResults = $derived(rules.map((rule) => ({ ...rule, met: rule.test(password) })));
	let allRulesMet = $derived(ruleResults.every((r) => r.met));
	let passwordsMatch = $derived(password === passwordConfirm && password.length > 0);
	let passwordMismatch = $derived(passwordConfirmTouched && passwordConfirm.length > 0 && password !== passwordConfirm);

	function handleRoleChange(value: string | undefined) {
		selectedRole = value || '';
	}
</script>

<svelte:head>
	<title>Add User - Busser</title>
</svelte:head>

<Breadcrumb name="Users" href="/settings/users">
	<BreadcrumbItem name="Add User"></BreadcrumbItem>
</Breadcrumb>

<div class="space-y-6 mt-3">
	<!-- header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Add User</h1>
			<p class="text-sm text-muted-foreground mt-1">Create a new user account</p>
		</div>
		<BackButton fallback="/settings/users" label="Back" variant="outline" size="sm" />
	</div>

	<form
		class="space-y-6"
		method="POST"
		action="/settings/users/add"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect') {
					goto(result.location);
				} else {
					await applyAction(result);
					if (result.type === 'failure' && result?.data?.error)
						$notificationStore.error = {
							message: result?.data?.error?.toString() || '',
						};
					if (result.type === 'success')
						$notificationStore.success = { message: 'User created.' };
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

		<!-- password card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Lock class="h-5 w-5" />
					Password
				</Card.Title>
				<Card.Description>Set the initial password for this account</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="password" class={errors?.password?.hasError ? 'text-destructive' : ''}>
						Password <span class="text-destructive">*</span>
					</Label>
					<Input
						type="password"
						id="password"
						name="password"
						required
						class={errors?.password?.hasError ? 'border-destructive' : ''}
						bind:value={password}
						oninput={() => (passwordTouched = true)}
					/>
					{#if errors?.password?.hasError}
						<Helper color="red">{errors.password.message}</Helper>
					{/if}
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
					<Label
						for="passwordConfirm"
						class={errors?.passwordConfirm?.hasError || passwordMismatch ? 'text-destructive' : ''}
					>
						Confirm Password <span class="text-destructive">*</span>
					</Label>
					<Input
						type="password"
						id="passwordConfirm"
						name="passwordConfirm"
						required
						class={errors?.passwordConfirm?.hasError || passwordMismatch ? 'border-destructive' : ''}
						bind:value={passwordConfirm}
						onblur={() => (passwordConfirmTouched = true)}
					/>
					{#if errors?.passwordConfirm?.hasError}
						<Helper color="red">{errors.passwordConfirm.message}</Helper>
					{:else if passwordMismatch}
						<Helper color="red">Passwords do not match.</Helper>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- roles card (admin only) -->
		{#if isAdmin && data.roles?.length}
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<KeyRound class="h-5 w-5" />
						Roles
					</Card.Title>
					<Card.Description>Assign a system role to this user</Card.Description>
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

		<!-- submit -->
		<div class="flex justify-end">
			<Button type="submit" disabled={!allRulesMet || !passwordsMatch} class="w-full sm:w-auto">
				<UserPlus class="h-4 w-4 mr-2" />
				Create User
			</Button>
		</div>
	</form>
</div>
