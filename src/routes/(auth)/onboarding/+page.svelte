<script lang="ts">
	import { AlertCircle, UserPlus } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import TermsContent from '$lib/components/TermsContent.svelte';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let errors = $derived(form?.errors);

	let username = $state('');
	let tosAccepted = $state(false);
	let tosDialogOpen = $state(false);
</script>

<svelte:head>
	<title>Complete Your Profile - Busser</title>
</svelte:head>

<div class="flex flex-col space-y-6">
	<div class="text-center">
		<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
			<UserPlus class="h-6 w-6 text-primary" />
		</div>
		<h3 class="text-xl font-medium">Complete Your Profile</h3>
		<p class="mt-2 text-sm text-muted-foreground">
			Just a few more details to get you started.
		</p>
	</div>

	{#if form?.message}
		<Alert.Root variant="destructive">
			<AlertCircle class="h-4 w-4" />
			<Alert.Title>Error</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<form class="space-y-6" method="POST" use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}
			await update();
		};
	}}>

		<!-- email (read-only, from oauth provider) -->
		<div class="space-y-2">
			<Label for="email">Email</Label>
			<Input type="email" id="email" value={data.email} disabled class="bg-muted" />
			<p class="text-xs text-muted-foreground">From your sign-in provider.</p>
		</div>

		<!-- username -->
		<div class="space-y-2">
			<Label for="username" class={errors?.username?.hasError ? 'text-destructive' : ''}>
				Username
			</Label>
			<Input
				type="text"
				id="username"
				name="username"
				bind:value={username}
				class={errors?.username?.hasError ? 'border-destructive' : ''}
			/>
			{#if errors?.username?.hasError}
				<Helper color="red">{errors.username.message}</Helper>
			{/if}
		</div>

		<!-- terms of service -->
		<div class="flex items-start gap-3">
			<Checkbox bind:checked={tosAccepted} />
			<label class="text-sm leading-tight text-muted-foreground">
				I agree to the
				<button
					type="button"
					class="text-primary underline-offset-4 hover:underline"
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

		<Button type="submit" size="lg" class="w-full" disabled={!tosAccepted || !username.trim()}>
			Get Started
		</Button>
	</form>
</div>
