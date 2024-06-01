<script lang="ts">
  import { enhance, applyAction } from '$app/forms';
  import { Button, Input, Label, Modal } from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib/types';

  export let user: User | null;
  export let action: String
</script>
<form class="flex flex-col space-y-6" 
  method="POST" 
  action="{action === 'edit'? 
    `/settings/users/${user?.userId}/edit` : 
    '/settings/users/add'
  }"
>
  
  <Label class="space-y-2">
    <span>Username</span>
    <Input type="text" name="username" placeholder="username" required value={user?.username || ''}/>
  </Label>  
  <Label class="space-y-2">
    <span>Email</span>
    <Input type="email" name="email" placeholder="name@company.com" required value={user?.email || ''}/>
  </Label>
  {#if action === 'edit'}
    <div class="flex items-start">
      <a href="/" class="text-sm text-primary-700 hover:underline dark:text-primary-500">Reset Password...</a>
    </div>
  {/if}
  {#if action === 'add'}
    <Label class="space-y-2">
      <span>Password</span>
      <Input type="password" name="password" placeholder="•••••" required />
    </Label>
    <Label class="space-y-2">
      <span>Confirm Password</span>
      <Input type="password" name="passwordConfirm" placeholder="•••••" required />
    </Label>
  {/if}
  <Button type="submit" class="w-full1">{action === 'edit'? 'Save Changes' : 'Submit'}</Button>
</form>