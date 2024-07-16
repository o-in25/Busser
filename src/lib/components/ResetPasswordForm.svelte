<script>
  import { Label, Input, Button } from 'flowbite-svelte';
  </script>
<form class="space-y-6"
  method="POST"
>
  <div class="mb-6">
    <Label for="oldPassword" class="mb-2">Your old password</Label>
    <Input type="password" name="oldPassword" placeholder="•••••" required/>
  </div>
  <div class="mb-6">
    <Label for="newPassword" class="mb-2">Your new password</Label>
    <Input type="password" name="newPassword" placeholder="•••••" required/>
  </div>
  <div class="mb-6">
    <Label for="passwordConfirm" class="mb-2">Confirm your new password</Label>
    <Input type="password" name="passwordConfirm" placeholder="•••••" required/>
  </div>
  <Button type="submit">Reset Password</Button>
</form>
<!-- <Popover class="text-sm" triggeredBy="#password" placement="bottom">
  <h3 class="font-semibold text-gray-900 dark:text-white">Must have at least 6 characters</h3>
  <div class="grid grid-cols-4 gap-2">
    <div class="h-1 bg-orange-300 dark:bg-orange-400" />
    <div class="h-1 bg-orange-300 dark:bg-orange-400" />
    <div class="h-1 bg-gray-200 dark:bg-gray-600" />
    <div class="h-1 bg-gray-200 dark:bg-gray-600" />
  </div>
  <p class="py-2">It’s better to have:</p>
  <ul>
    <li class="flex items-center mb-1">
      <CheckOutline class="me-2 w-4 h-4 text-green-400 dark:text-green-500" />
      Upper &amp; lower case letters
    </li>
    <li class="flex items-center mb-1">
      <CheckOutline class="me-2 w-4 h-4 text-green-400 dark:text-green-500" />
      A symbol (#$&amp;)
    </li>
    <li class="flex items-center">
      <CloseOutline class="me-2 w-4 h-4 text-gray-300 dark:text-gray-400" />A longer password (min. 12 chars.)
    </li>
  </ul>
</Popover> -->