<script lang="ts">
	import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-svelte';

	import { applyAction, enhance } from '$app/forms';
	import * as Alert from '$lib/components/ui/alert';
	import { Button, buttonVariants } from '$lib/components/ui/button';
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
					await applyAction(result);
				} else if (result.type === 'redirect') {
					window.location.href = result.location;
				}
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

	<div class="relative flex items-center">
		<div class="flex-grow border-t border-border"></div>
		<span class="mx-4 text-sm text-muted-foreground">or</span>
		<div class="flex-grow border-t border-border"></div>
	</div>

	<a href="/api/oauth/google" class={buttonVariants({ variant: 'outline' }) + ' w-full gap-3'}>
		<svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true">
			<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
			<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
			<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
			<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
		</svg>
		Sign in with Google
	</a>

	<!-- TODO: enable when apple developer account is set up
	<a href="/api/oauth/apple" class={buttonVariants({ variant: 'outline' }) + ' w-full gap-3'}>
		<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
			<path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
		</svg>
		Sign in with Apple
	</a>
	-->
</div>
