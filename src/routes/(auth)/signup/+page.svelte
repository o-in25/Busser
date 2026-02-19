<script lang="ts">
	import { AlertCircle } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import * as Alert from '$lib/components/ui/alert';
	import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte';
	import UserForm from '$lib/components/UserForm.svelte';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let errors = $derived(form?.errors);

	// pre-fill invitation code from URL
	let invitationCode = $state(data.invitationCode || '');

	let formRef: any;
</script>

<svelte:head>
	<title>Sign Up - Busser</title>
</svelte:head>

<div class="flex flex-col space-y-6">
	<h3 class="text-xl font-medium">Sign up</h3>
	{#if form?.message}
		<Alert.Root variant="destructive">
			<AlertCircle class="h-4 w-4" />
			<Alert.Title>Error</Alert.Title>
			<Alert.Description>{form?.message}</Alert.Description>
		</Alert.Root>
	{/if}
	<form class="space-y-6" method="POST" action="/signup" use:enhance>
		<UserForm
			bind:this={formRef}
			user={null}
			action="register"
			{errors}
			bind:invitationCode
			inviteOnly={data.inviteOnly}
		/>
	</form>

	<div class="relative">
		<div class="absolute inset-0 flex items-center">
			<span class="w-full border-t border-border"></span>
		</div>
		<div class="relative flex justify-center text-xs uppercase">
			<span class="bg-card px-2 text-muted-foreground">or continue with</span>
		</div>
	</div>

	<a
		href="/auth/google"
		class="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
	>
		<GoogleIcon class="h-5 w-5" />
		Google
	</a>
</div>
