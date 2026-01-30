<script lang="ts">
	import { ArrowRight, CheckCircle2, Loader2, XCircle } from 'lucide-svelte';

	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isResending = $state(false);
	let resendStatus = $state<'idle' | 'success' | 'error'>('idle');

	async function resendEmail() {
		if (!data.userId) return;

		isResending = true;
		resendStatus = 'idle';

		try {
			const response = await fetch('/api/mail/user-registration', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ userId: data.userId }),
			});

			if (response.ok) {
				resendStatus = 'success';
			} else {
				resendStatus = 'error';
			}
		} catch {
			resendStatus = 'error';
		} finally {
			isResending = false;
		}
	}
</script>

<div>
	{#if data.status === 'success'}
		<CheckCircle2 class="w-8 h-8 mb-3 text-green-500 dark:text-green-400" />
	{:else}
		<XCircle class="w-8 h-8 mb-3 text-red-500 dark:text-red-400" />
	{/if}
	{#if data.status === 'success'}
		<h4 class="text-xl font-semibold mb-2">Your account has been verified!</h4>
	{:else}
		<h4 class="text-xl font-semibold mb-2">Verification failed</h4>
	{/if}
	{#if data.status === 'success'}
		<p class="mb-3 font-normal text-muted-foreground">
			Thanks for confirming your email. Your account is now active.
		</p>
	{:else}
		<p class="mb-3 font-normal text-muted-foreground">
			Your verification link may have expired or is invalid.
		</p>
	{/if}
	{#if data.status === 'success'}
		<a class={cn(buttonVariants({ variant: 'outline' }), 'mt-4')} href="/login">
			Login
			<ArrowRight class="ms-2 h-5 w-5" />
		</a>
	{:else if resendStatus === 'success'}
		<p class="mt-4 text-sm text-green-500 dark:text-green-400">
			Verification email sent! Please check your inbox.
		</p>
	{:else}
		<Button
			class="mt-4"
			variant="outline"
			onclick={resendEmail}
			disabled={isResending || !data.userId}
		>
			{#if isResending}
				<Loader2 class="me-2 h-4 w-4 animate-spin" />
				Sending...
			{:else}
				Resend Email
			{/if}
		</Button>
		{#if resendStatus === 'error'}
			<p class="mt-2 text-sm text-red-500 dark:text-red-400">
				Failed to resend email. Please try again.
			</p>
		{/if}
		{#if !data.userId}
			<p class="mt-2 text-sm text-muted-foreground">
				Unable to resend email. Please try signing up again.
			</p>
		{/if}
	{/if}
</div>
