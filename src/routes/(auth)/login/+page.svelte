<script lang="ts">
	  import { enhance } from '$app/forms';
    import { Card, Button, Label, Input, Checkbox } from 'flowbite-svelte';
    import type { PageData, ActionData } from './$types';
    export let data: PageData;
	  export let form: ActionData; 

</script>

<div class="flex justify-center p-10">
  <Card>
    <form class="flex flex-col space-y-6" method="POST" action="?/login" use:enhance>
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">Sign in</h3>
      <Label class="space-y-2">
        <span>Username</span>
        <Input name="username" value={form?.username ?? ''} required />
      </Label>
      <Label class="space-y-2">
        <span>Password</span>
        <Input type="password" name="password" required />
      </Label>
      <div class="flex items-start">
        <Checkbox>Remember me</Checkbox>
        <a href="/" class="ms-auto text-sm text-primary-700 hover:underline dark:text-primary-500"> Lost password? </a>
      </div>
      <Button type="submit" class="w-full">Sign in</Button>
      <div class="text-sm font-medium text-gray-500 dark:text-gray-300">
        Not registered? <a href="/" class="text-primary-700 hover:underline dark:text-primary-500"> Create account </a>
      </div>
      {#if form?.err}
        <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <span class="font-medium">Username or password is incorrect.</span>

        </div>
      {/if}
    </form>
  </Card>
</div>