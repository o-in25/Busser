<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import * as Alert from '$lib/components/ui/alert';
	import type { ActionData } from './$types';
	import { AlertCircle } from 'lucide-svelte';
	import UserForm from '$lib/components/UserForm.svelte';
	export let form: ActionData;
	let formRef: any;
</script>

<svelte:head>
	<title>Log In - Busser</title>
</svelte:head>
<div class="flex flex-col space-y-6">
	<h3 class="text-xl font-medium">Log in</h3>
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
				invitationCode: { hasError: false, message: '' }
			}}
		/>
	</form>
</div>
