<script lang="ts">
	import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-svelte';

	import { applyAction, enhance } from '$app/forms';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import UserForm from '$lib/components/UserForm.svelte';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let formRef: any;
	let isResending = $state(false);
	let resendStatus = $state<'idle' | 'success' | 'error'>('idle');
	let resendError = $state('');

	async function resendVerificationEmail() {
		const email = (form as any)?.email;
		if (!email) return;

		isResending = true;
		resendStatus = 'idle';
		resendError = '';

		try {
			const response = await fetch('/api/mail/user-registration', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			const result = await response.json();

			if (response.ok) {
				resendStatus = 'success';
			} else {
				resendStatus = 'error';
				resendError = String(result.error || 'Failed to resend email.');
			}
		} catch {
			resendStatus = 'error';
			resendError = 'An error occurred. Please try again.';
		} finally {
			isResending = false;
		}
	}
</script>

<svelte:head>
	<title>Log In - Busser</title>
</svelte:head>
<div class="flex flex-col space-y-6">
	<h3 class="text-xl font-medium">Log in</h3>
	{#if data.passwordReset}
		<Alert.Root variant="success">
			<CheckCircle2 class="h-4 w-4" />
			<Alert.Title>Password reset successful</Alert.Title>
			<Alert.Description
				>Your password has been reset. You can now log in with your new password.</Alert.Description
			>
		</Alert.Root>
	{/if}
	{#if (form as any)?.needsVerification}
		<Alert.Root variant="warning">
			<AlertCircle class="h-4 w-4" />
			<Alert.Title>Email verification required</Alert.Title>
			<Alert.Description>
				<p>{form?.error}</p>
				<div class="mt-3">
					{#if resendStatus === 'success'}
						<p class="text-sm text-green-600 dark:text-green-400">
							<Mail class="w-4 h-4 inline-block mr-1" />
							Verification email sent! Please check your inbox.
						</p>
					{:else}
						<Button
							variant="outline"
							size="sm"
							class="border-yellow-500/50 hover:bg-yellow-500/20 hover:border-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 focus-visible:ring-yellow-500"
							onclick={resendVerificationEmail}
							disabled={isResending}
						>
							{#if isResending}
								<Loader2 class="w-4 h-4 mr-2 animate-spin" />
								Sending...
							{:else}
								<Mail class="w-4 h-4 mr-2" />
								Resend verification email
							{/if}
						</Button>
						{#if resendStatus === 'error'}
							<p class="mt-2 text-sm text-destructive">{resendError}</p>
						{/if}
					{/if}
				</div>
			</Alert.Description>
		</Alert.Root>
	{:else if form?.error}
		<Alert.Root variant="destructive">
			<AlertCircle class="h-4 w-4" />
			<Alert.Title>Error</Alert.Title>
			<Alert.Description>{form.error}</Alert.Description>
		</Alert.Root>
	{/if}
	<form
		class="space-y-6"
		method="POST"
		action="/login"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'failure') {
					formRef.clearSensitiveFields();
				}
				await applyAction(result);
			};
		}}
	>
		<UserForm
			bind:this={formRef}
			user={null}
			action="login"
			errors={{
				username: form?.errors?.username ?? { hasError: false, message: '' },
				email: form?.errors?.email ?? { hasError: false, message: '' },
				password: form?.errors?.password ?? { hasError: false, message: '' },
				passwordConfirm: form?.errors?.passwordConfirm ?? { hasError: false, message: '' },
				invitationCode: { hasError: false, message: '' },
			}}
		/>
	</form>
</div>
