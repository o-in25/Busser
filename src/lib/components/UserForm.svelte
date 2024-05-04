<script lang="ts">
  import { enhance, applyAction } from '$app/forms';
  import { Button, Input, Label, Modal } from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib/types';

  let opened = false;
  export const toggle = () => opened = true;
  export let user: User;
</script>
<Modal title="Create New User" bind:open={opened}>
  <form class="flex flex-col space-y-6" 
    method="POST" 
    action="?/addUser" 
    use:enhance={({ formElement, formData, action, cancel }) => {
      return async ({ result }) => {
          await applyAction(result);
      };
	  }}>
    <Label class="space-y-2">
      <span>Username</span>
      <Input type="email" name="username" placeholder="username" required value={user?.email || ''}/>
    </Label>  
    <Label class="space-y-2">
      <span>Email</span>
      <Input type="email" name="email" placeholder="name@company.com" required />
    </Label>
    <Label class="space-y-2">
      <span>Password</span>
      <Input type="password" name="password" placeholder="•••••" required />
    </Label>
    <!-- <div class="flex items-start">
      <Checkbox>Remember me</Checkbox>
      <a href="/" class="ms-auto text-sm text-primary-700 hover:underline dark:text-primary-500"> Lost password? </a>
    </div> -->
    <Button type="submit" class="w-full1">Add User</Button>
    <!-- <div class="text-sm font-medium text-gray-500 dark:text-gray-300">
      Not registered? <a href="/" class="text-primary-700 hover:underline dark:text-primary-500"> Create account </a>
    </div> -->
  </form>
</Modal>