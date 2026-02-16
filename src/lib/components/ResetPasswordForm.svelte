<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { canForceReset = false }: { canForceReset?: boolean } = $props();
</script>

<form class="space-y-6" method="POST">
	{#if !canForceReset}
		<div class="mb-6">
			<Label for="oldPassword" class="mb-2">Old password</Label>
			<Input type="password" name="oldPassword" placeholder="•••••" required />
		</div>
	{/if}
	<div class="mb-6">
		<Label for="newPassword" class="mb-2">New Password</Label>
		<Input type="password" name="newPassword" placeholder="•••••" required />
	</div>
	<div class="mb-6">
		<Label for="passwordConfirm" class="mb-2">Confirm New Password</Label>
		<Input type="password" name="passwordConfirm" placeholder="•••••" required />
	</div>
	<Button type="submit">Reset Password</Button>
</form>
