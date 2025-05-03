<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		Card,
		Label,
		Input,
		GradientButton,
		Alert,
		Helper,
	} from 'flowbite-svelte';
	import type { PageData, ActionData } from './$types';
	import { ExclamationCircleSolid } from 'flowbite-svelte-icons';
	import UserForm from '$lib/components/UserForm.svelte';
	export let data: PageData;
	export let form: ActionData;



	let errors = {
		username: '',
		password: '',
	};


	function validate(username, password): boolean {
		let hasError = false;
		if (!username.trim().length) {
			hasError = true;
			errors.username = 'Username is required';
		}

		if (!password.trim().length) {
			hasError = true;
			errors.password = 'Password is required';
		}

		return hasError;
	}

  let formRef;


</script>

<svelte:head>
	<title>Sign Up - Busser</title>
</svelte:head>
<div class="flex flex-col space-y-6">
	<h3 class="text-xl font-medium text-gray-900 dark:text-white">Sign up</h3>
	{#if form?.error}
		<Alert
			border
			color="red"
		>
			<ExclamationCircleSolid
				slot="icon"
				class="w-5 h-5"
			/>
			{form.error}
		</Alert>
	{/if}
	<form
		class="space-y-6"
		method="POST"
		action="/login"
    use:enhance={() => {
      return async ({ result }) => {
        console.log(result)
        if(result.type === 'failure') {
          formRef.clearSensitiveFields();
        }
        await applyAction(result);
      }
    }}
	>
		<UserForm
    bind:this={formRef} 
			user={null}
			action="login"
		/>
	</form>
</div>

<!-- {#if form?.err}
<Alert
  border
  color="red"
>
  <ExclamationCircleSolid
    slot="icon"
    class="w-5 h-5"
  />
  Username or password is incorrect.
</Alert>
{/if} -->
