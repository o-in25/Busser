<script lang="ts">
	import { AlertCircle, ArrowLeft, Loader2, Lock, XCircle } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import * as Alert from '$lib/components/ui/alert';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Reset Password - Busser</title>
</svelte:head>

<div class="flex flex-col space-y-6">
	{#if !data.tokenValid && data.tokenExpired}
		<!-- Expired token -->
		<div>
			<XCircle class="w-8 h-8 mb-3 text-destructive" />
			<h4 class="text-xl font-semibold mb-2">Link expired</h4>
			<p class="mb-3 font-normal text-muted-foreground">
				This password reset link has expired. Please request a new one.
			</p>
			<a href="/forgot-password" class={cn(buttonVariants({ variant: 'outline' }))}>
				Request new link
			</a>
		</div>
	{:else if !data.tokenValid}
		<!-- Invalid token -->
		<div>
			<XCircle class="w-8 h-8 mb-3 text-destructive" />
			<h4 class="text-xl font-semibold mb-2">Invalid link</h4>
			<p class="mb-3 font-normal text-muted-foreground">
				This password reset link is invalid. Please request a new one.
			</p>
			<a href="/forgot-password" class={cn(buttonVariants({ variant: 'outline' }))}>
				Request new link
			</a>
		</div>
	{:else}
		<!-- Valid token - show reset form -->
		<div>
			<h3 class="text-xl font-medium mb-2">Reset your password</h3>
			{#if data.email}
				<p class="text-sm text-muted-foreground">
					Enter a new password for <span class="font-medium text-foreground">{data.email}</span>.
				</p>
			{:else}
				<p class="text-sm text-muted-foreground">Enter your new password below.</p>
			{/if}
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
				<Label for="password">New password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder="Enter new password"
					required
					minlength={8}
				/>
				<p class="text-xs text-muted-foreground">Must be at least 8 characters</p>
			</div>

			<div class="space-y-2">
				<Label for="passwordConfirm">Confirm password</Label>
				<Input
					id="passwordConfirm"
					name="passwordConfirm"
					type="password"
					placeholder="Confirm new password"
					required
				/>
			</div>

			<div class="flex flex-col gap-3">
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="w-4 h-4 mr-2 animate-spin" />
						Resetting...
					{:else}
						<Lock class="w-4 h-4 mr-2" />
						Reset password
					{/if}
				</Button>

				<a href="/login" class={cn(buttonVariants({ variant: 'ghost' }))}>
					<ArrowLeft class="w-4 h-4 mr-2" />
					Back to login
				</a>
			</div>
		</form>
	{/if}
</div>
