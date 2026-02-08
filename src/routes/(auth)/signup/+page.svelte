<script lang="ts">
	import { AlertCircle } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import * as Alert from '$lib/components/ui/alert';
	import UserForm from '$lib/components/UserForm.svelte';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let errors = $derived(form?.errors);

	// pre-fill invitation code from URL
	let invitationCode = $state(data.invitationCode || '');

	let formRef: any;
</script>

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
		<UserForm bind:this={formRef} user={null} action="register" {errors} bind:invitationCode inviteOnly={data.inviteOnly} />
	</form>
</div>
