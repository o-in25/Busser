<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
</script>

<form class="space-y-6" method="POST">
	<div class="mb-6">
		<Label for="oldPassword" class="mb-2">Your old password</Label>
		<Input type="password" name="oldPassword" placeholder="•••••" required />
	</div>
	<div class="mb-6">
		<Label for="newPassword" class="mb-2">Your new password</Label>
		<Input type="password" name="newPassword" placeholder="•••••" required />
	</div>
	<div class="mb-6">
		<Label for="passwordConfirm" class="mb-2">Confirm your new password</Label>
		<Input type="password" name="passwordConfirm" placeholder="•••••" required />
	</div>
	<Button type="submit">Reset Password</Button>
</form>
