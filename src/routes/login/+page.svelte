<div class="flex justify-center p-10">
  <Card>
    <form class="flex flex-col space-y-6" on:submit={login}>
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">Sign in</h3>
      <Label class="space-y-2">
        <span>Email</span>
        <Input name="username" bind:value={username} required />
      </Label>
      <Label class="space-y-2">
        <span>Password</span>
        <Input type="password" name="password" bind:value={password} required />
      </Label>
      <div class="flex items-start">
        <Checkbox>Remember me</Checkbox>
        <a href="/" class="ms-auto text-sm text-primary-700 hover:underline dark:text-primary-500"> Lost password? </a>
      </div>
      <Button type="submit" class="w-full">Sign in</Button>
      <div class="text-sm font-medium text-gray-500 dark:text-gray-300">
        Not registered? <a href="/" class="text-primary-700 hover:underline dark:text-primary-500"> Create account </a>
      </div>
    </form>
  </Card>
</div>

<script lang="ts">
    import type { PageData } from './$types';
    import { Card, Button, Label, Input, Checkbox } from 'flowbite-svelte';
    let username: String, password: String;
    async function login() {
      try {
          const response = await fetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        console.log(data)
      } catch(e) {
        console.error(e)
      }
    }
    

</script>