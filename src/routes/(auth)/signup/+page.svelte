<script lang="ts">
	import { Card, Label, Checkbox, Button, Input } from 'flowbite-svelte';
	import type { ActionData, PageData } from './$types';
	import UserForm from '$lib/components/UserForm.svelte';
	import type { FormSubmitResult } from '$lib/types';
	import type { ActionResult } from '@sveltejs/kit';
	import { enhance, applyAction } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

  let errors = $derived(form?.errors);

	let formRef: any;
</script>

<!-- <div class="flex justify-center p-10">

<Card>
  <form class="flex flex-col space-y-6" action="/">
    <h3 class="text-xl font-medium text-gray-900 dark:text-white">Sign Up</h3>
    <Label class="space-y-2">
      <span>Email</span>
      <Input type="email" name="email" placeholder="" required />
    </Label>
    <Label class="space-y-2">
      <span>Invitation Code</span>
      <Input type="password" name="password" placeholder="•••••" required />
    </Label>
    <Button type="submit" class="w-full">Create Account</Button>
    <div class="text-sm font-medium text-gray-500 dark:text-gray-300">
      Already registered? <a href="/login" class="text-primary-700 hover:underline dark:text-primary-500">Login</a>
    </div>
  </form>
</Card>
</div>   -->
<svelte:head>
	<title>Sign Up - Busser</title>
</svelte:head>
<div class="flex flex-col space-y-6">
	<h3 class="text-xl font-medium text-gray-900 dark:text-white">Sign up</h3>
	<form
		class="space-y-6"
		method="POST"
		action="/signup"
    use:enhance
	>

		<UserForm
			bind:this={formRef}
			user={null}
			action="register"
			errors={errors}
		/>
	</form>
</div>
