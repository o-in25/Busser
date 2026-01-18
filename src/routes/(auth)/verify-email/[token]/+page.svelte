<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import {
		ArrowRight,
		CheckCircle2,
		XCircle,
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	async function resendEmail() {
		await fetch('/api/mail/user-registration', {
			method: 'POST',
			body: JSON.stringify('{}')
		});
	}
</script>

<div>
	{#if data.status === 'success'}
		<CheckCircle2 class="w-8 h-8 mb-3 text-green-500 dark:text-green-400" />
	{:else}
		<XCircle class="w-8 h-8 mb-3 text-red-500 dark:text-red-400" />
	{/if}
	{#if data.status === 'success'}
		<h4 class="text-xl font-semibold mb-2">
			Your account has been verified!
		</h4>
	{:else}
		<h4 class="text-xl font-semibold mb-2">
			Verification failed
		</h4>
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
		<a class={cn(buttonVariants({ variant: "outline" }), "mt-4")} href="/login">
			Login
			<ArrowRight class="ms-2 h-5 w-5" />
		</a>
	{:else}
		<Button class="mt-4" variant="outline" onclick={resendEmail}>
			Resend Email
		</Button>
	{/if}
</div>
