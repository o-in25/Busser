<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Alert from '$lib/components/ui/alert';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils';
	import type { ActionData } from './$types';
	import { AlertCircle, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Forgot Password - Busser</title>
</svelte:head>

<div class="flex flex-col space-y-6">
	{#if (form as any)?.success}
		<div>
			<CheckCircle2 class="w-8 h-8 mb-3 text-green-500 dark:text-green-400" />
			<h4 class="text-xl font-semibold mb-2">Check your email</h4>
			<p class="mb-3 font-normal text-muted-foreground">
				If an account exists for <span class="font-medium text-foreground">{(form as any)?.email}</span>,
				we've sent a password reset link. The link will expire in 1 hour.
			</p>
			<p class="text-sm text-muted-foreground mb-6">
				Didn't receive the email? Check your spam folder or try again.
			</p>
			<div class="flex gap-3">
				<a href="/login" class={cn(buttonVariants({ variant: "outline" }))}>
					<ArrowLeft class="w-4 h-4 mr-2" />
					Back to login
				</a>
			</div>
		</div>
	{:else}
		<div>
			<h3 class="text-xl font-medium mb-2">Forgot your password?</h3>
			<p class="text-sm text-muted-foreground">
				Enter your email address and we'll send you a link to reset your password.
			</p>
		</div>

		{#if form?.error}
			<Alert.Root variant="destructive">
				<AlertCircle class="h-4 w-4" />
				<Alert.Title>Error</Alert.Title>
				<Alert.Description>{form.error}</Alert.Description>
			</Alert.Root>
		{/if}

		<form
			class="space-y-6"
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			<div class="space-y-2">
				<Label for="email">Email address</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="you@example.com"
					value={(form as any)?.email || ''}
					required
				/>
			</div>

			<div class="flex flex-col gap-3">
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="w-4 h-4 mr-2 animate-spin" />
						Sending...
					{:else}
						<Mail class="w-4 h-4 mr-2" />
						Send reset link
					{/if}
				</Button>

				<a href="/login" class={cn(buttonVariants({ variant: "ghost" }))}>
					<ArrowLeft class="w-4 h-4 mr-2" />
					Back to login
				</a>
			</div>
		</form>
	{/if}
</div>
