<script lang="ts">
	import { CheckCircle2, Loader2, Mail } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isResending = $state(false);
	let resendStatus = $state<'idle' | 'success' | 'error'>('idle');
	let errorMessage = $state('');

	async function resendEmail() {
		if (!data.email) return;

		isResending = true;
		resendStatus = 'idle';
		errorMessage = '';

		try {
			const response = await fetch('/api/mail/user-registration', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: data.email }),
			});

			const result = await response.json();

			if (response.ok) {
				resendStatus = 'success';
			} else {
				resendStatus = 'error';
				errorMessage = result.error || 'Failed to resend email.';
			}
		} catch {
			resendStatus = 'error';
			errorMessage = 'An error occurred. Please try again.';
		} finally {
			isResending = false;
		}
	}
</script>

<svelte:head>
	<title>Verify Email - Busser</title>
</svelte:head>

<div>
	<CheckCircle2 class="w-8 h-8 mb-3 text-green-500 dark:text-green-400" />
	<h4 class="text-xl font-semibold mb-2">Check your email</h4>
	<p class="mb-3 font-normal text-muted-foreground">
		Thanks for signing up! We've sent a confirmation link to
		{#if data.email}
			<span class="font-medium text-foreground">{data.email}</span>.
		{:else}
			your inbox.
		{/if}
		Click the link in that email to verify your address and complete your registration.
	</p>

	<div class="mt-6 pt-6 border-t border-border">
		<p class="text-sm text-muted-foreground mb-3">
			Didn't receive the email? Check your spam folder or request a new one.
		</p>

		{#if resendStatus === 'success'}
			<p class="text-sm text-green-600 dark:text-green-400">
				<Mail class="w-4 h-4 inline-block mr-1" />
				Verification email sent! Please check your inbox.
			</p>
		{:else}
			<Button variant="outline" onclick={resendEmail} disabled={isResending || !data.email}>
				{#if isResending}
					<Loader2 class="w-4 h-4 mr-2 animate-spin" />
					Sending...
				{:else}
					<Mail class="w-4 h-4 mr-2" />
					Resend verification email
				{/if}
			</Button>

			{#if resendStatus === 'error'}
				<p class="mt-2 text-sm text-destructive">
					{errorMessage}
				</p>
			{/if}

			{#if !data.email}
				<p class="mt-2 text-sm text-muted-foreground">
					Unable to resend. Please try signing up again.
				</p>
			{/if}
		{/if}
	</div>
</div>
