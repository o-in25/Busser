<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Card,
		Label,
		Input,
		GradientButton,
		Alert,
		Helper,
	} from 'flowbite-svelte';
	import type { PageData, ActionData } from './$types';
	import {
		ExclamationCircleSolid,
	} from 'flowbite-svelte-icons';
	import UserForm from '$lib/components/UserForm.svelte';
		export let data: PageData;
	export let form: ActionData;

  let errors = {
    username: '',
    password: ''
  };

  function validate(username, password): boolean {
    let hasError = false;
    if(!username.trim().length) {
      hasError = true;
      errors.username = 'Username is required';
    }

    if(!password.trim().length) {
      hasError = true;
      errors.password = 'Password is required';
    }

    return hasError;  
  }
</script>


<svelte:head>
	<title>Sign Up - Busser</title>
</svelte:head>
<div class="flex flex-col space-y-6">
  <h3 class="text-xl font-medium text-gray-900 dark:text-white">Sign up</h3>
  <UserForm user={null} action="login" suppressToast={false}/>
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