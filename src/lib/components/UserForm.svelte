<script lang="ts">
	import { getContext } from 'svelte';
	import { Circle, CircleCheck } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import TermsContent from '$lib/components/TermsContent.svelte';
	import type { SelectOption } from '$lib/types';
	import type { User } from '$lib/types/auth';

	const defaultErrors = {
		username: { hasError: false, message: '' },
		email: { hasError: false, message: '' },
		password: { hasError: false, message: '' },
		passwordConfirm: { hasError: false, message: '' },
		invitationCode: { hasError: false, message: '' },
	};

	let {
		user = null,
		action,
		roles = [],
		password = $bindable(''),
		passwordConfirm = $bindable(''),
		invitationCode = $bindable(''),
		inviteOnly = true,
		errors = defaultErrors,
	}: {
		user?: User | null;
		action: 'add' | 'edit' | 'register' | 'login';
		roles?: SelectOption[];
		password?: string;
		passwordConfirm?: string;
		invitationCode?: string;
		inviteOnly?: boolean;
		errors?: typeof defaultErrors;
	} = $props();

	export function clearSensitiveFields() {
		password = '';
		passwordConfirm = '';
	}

	const permissions: string[] = getContext('permissions');

	let selected = user?.roles.map(({ roleId }) => roleId) || [];
	let selectedRole = $state(selected.length ? String(selected[0]) : '');

	const needsPasswordCheck = action === 'add' || action === 'register';
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const rules = [
		{ label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
		{ label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
		{ label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
		{ label: 'One number', test: (pw: string) => /\d/.test(pw) },
		{ label: 'One special character', test: (pw: string) => /[!@#$%^&*(),.?":{}|<>\-_=+\\[\]\/`~;']/.test(pw) },
	];

	let passwordTouched = $state(false);
	let passwordConfirmTouched = $state(false);
	let emailTouched = $state(false);
	let emailValue = $state(user?.email || '');
	let tosAccepted = $state(false);
	let tosDialogOpen = $state(false);

	let ruleResults = $derived(rules.map((rule) => ({ ...rule, met: rule.test(password) })));
	let allRulesMet = $derived(ruleResults.every((r) => r.met));
	let passwordsMatch = $derived(password === passwordConfirm && password.length > 0);
	let emailInvalid = $derived(emailTouched && emailValue.length > 0 && !emailRegex.test(emailValue));
	let passwordMismatch = $derived(passwordConfirmTouched && passwordConfirm.length > 0 && password !== passwordConfirm);
	let submitDisabled = $derived(
		(needsPasswordCheck && (!allRulesMet || !passwordsMatch)) ||
		(action === 'register' && !tosAccepted)
	);

	function handleRoleChange(value: string | undefined) {
		selectedRole = value || '';
	}
</script>

<!-- username -->
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
			<Helper color="red">
				{errors?.email.message}
			</Helper>
		{:else if emailInvalid}
			<Helper color="red">Please enter a valid email address.</Helper>
		{/if}
	</div>
{/if}

<!-- role (only show for admins) -->
{#if (action === 'edit' || action === 'add') && permissions?.includes('edit_admin')}
	<div class="space-y-2">
		<Label>Role <span class="text-destructive">*</span></Label>
		<input class="hidden" name="roles" id="roles" bind:value={selectedRole} />
		<Select.Root type="single" value={selectedRole} onValueChange={handleRoleChange}>
			<Select.Trigger class="w-full">
				<Select.Value placeholder="Select a role...">
					{#if selectedRole}
						{roles.find((r) => String(r.value) === selectedRole)?.name}
					{/if}
				</Select.Value>
			</Select.Trigger>
			<Select.Content>
				{#each roles as role}
					<Select.Item value={String(role.value)} label={role.name} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
{/if}

{#if action === 'add' || action === 'register' || action === 'login'}
	<!-- password -->
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
		{#if errors?.password.hasError}
			<Helper color="red">
				{errors?.password.message}
			</Helper>
		{/if}
		{#if needsPasswordCheck && passwordTouched}
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
				<Helper color="red">
					{errors?.passwordConfirm.message}
				</Helper>
			{:else if passwordMismatch}
				<Helper color="red">Passwords do not match.</Helper>
			{/if}
		</div>
	{/if}

	{#if action === 'register' && inviteOnly}
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

{#if action === 'register'}
	<div class="flex items-start gap-3">
		<Checkbox bind:checked={tosAccepted} />
		<label class="text-sm text-muted-foreground leading-tight">
			I agree to the
			<button
				type="button"
				class="text-primary hover:underline underline-offset-4"
				onclick={() => (tosDialogOpen = true)}
			>
				Terms of Service
			</button>
		</label>
	</div>

	<Dialog.Root bind:open={tosDialogOpen}>
		<Dialog.Content class="sm:max-w-2xl max-h-[85vh] flex flex-col">
			<Dialog.Header>
				<Dialog.Title>Terms of Service</Dialog.Title>
			</Dialog.Header>
			<div class="overflow-y-auto flex-1 custom-scrollbar">
				<TermsContent />
			</div>
			<Dialog.Footer class="pt-4 border-t border-border">
				<Button variant="outline" type="button" onclick={() => (tosDialogOpen = false)}>
					Close
				</Button>
				<Button
					type="button"
					onclick={() => {
						tosAccepted = true;
						tosDialogOpen = false;
					}}
				>
					Accept
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<!-- submit -->
{#if action === 'register' || action === 'login'}
	<Button
		type="submit"
		size="lg"
		class="w-full"
		disabled={submitDisabled}
	>
		{action === 'register' ? 'Sign up' : 'Log in'}
	</Button>
{:else}
	<div class="md:flex justify-end">
		<Button class="w-full md:w-32" type="submit" size="lg" disabled={submitDisabled}>Save</Button>
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
