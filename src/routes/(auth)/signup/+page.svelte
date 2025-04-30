<script lang="ts">
	import { Card, Label, Checkbox, Button, Input } from 'flowbite-svelte';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<div class="flex justify-center p-10">

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
</div>  