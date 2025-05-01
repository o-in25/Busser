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
		export let data: PageData;
	export let form: ActionData;

  let errors = {
    username: '',
    password: ''
  };

  function validate(formData: FormData): boolean {
    let hasError = false;
    const username = formData.get('username')?.toString()?.trim() || '';
    const password = formData.get('password')?.toString()?.trim() || '';
    if(!username) {
      hasError = true;
      errors.username = 'Username is required.';
    }

    if(!password) {
      hasError = true;
      errors.password = 'Password is required.';
    }

    return hasError;  
  }
</script>
<svelte:head>
	<title>Log In - Busser</title>
</svelte:head>
		<form
			class="flex flex-col space-y-6"
			method="POST"
			action="?/login"
			use:enhance={({ formData, cancel }) => {
        if(validate(formData)) {
          cancel();
        } else {
          errors = {
            username: '',
            password: ''
          }
        }
      }}
		>
			<h3 class="text-xl font-medium text-gray-900 dark:text-white">Log in</h3>
			<Label class="space-y-2" color="{errors.username? 'red' : 'gray'}">
				<span>Username</span>
				<Input
					name="username"
          color="{errors.username? 'red' : 'base'}"
					value={form?.username ?? ''}
				/>
        {#if errors.username}
          <Helper class='mt-2' color='red'><span class="font-medium">{errors.username}</span></Helper>
        {/if}
			</Label>
			<Label class="space-y-2" color="{errors.password? 'red' : 'gray'}">
				<span>Password</span>
				<Input
          color="{errors.password? 'red' : 'base'}"
					type="password"
					name="password"
				/>
        {#if errors.password}
          <Helper class='mt-2' color='red'><span class="font-medium">{errors.password}</span></Helper>
        {/if}
			</Label>
			<!-- <div class="flex items-start">
        <Checkbox>Remember me</Checkbox>
        <a href="/" class="ms-auto text-sm text-primary-700 hover:underline dark:text-primary-500"> Lost password? </a>
      </div> -->
			<div class="!mt-8">
				<!-- <FancyButton type="submit">
          <span class="pl-1">Log In</span>
        </FancyButton> -->
				<GradientButton
					color="pinkToOrange"
					size="lg"
					class="w-full hover:!bg-transparent"
					type="submit"
				>
					Log in
				</GradientButton>
			</div>
      <div class="text-sm font-medium text-gray-500 dark:text-gray-300">
        Not registered? <a href="/signup" class="text-primary-700 hover:underline dark:text-primary-500"> Sign up </a>
      </div>
			<!-- <div class="text-sm font-medium text-gray-500 dark:text-gray-300">
        Not registered? <a href="/" class="text-primary-700 hover:underline dark:text-primary-500"> Create account </a>
      </div> -->
			{#if form?.err}
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
			{/if}
		</form>