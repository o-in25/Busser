<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Card,
		Label,
		Input,
		GradientButton,
		Alert,
	} from 'flowbite-svelte';
	import type { PageData, ActionData } from './$types';
	import {
		ExclamationCircleSolid,
	} from 'flowbite-svelte-icons';
		export let data: PageData;
	export let form: ActionData;
</script>

<div class="flex justify-center p-10">
	<Card>
		<form
			class="flex flex-col space-y-6"
			method="POST"
			action="?/login"
			use:enhance
		>
			<h3 class="text-xl font-medium text-gray-900 dark:text-white">Sign in</h3>
			<Label class="space-y-2">
				<span>Username</span>
				<Input
					name="username"
					value={form?.username ?? ''}
					required
				/>
			</Label>
			<Label class="space-y-2">
				<span>Password</span>
				<Input
					type="password"
					name="password"
					required
				/>
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
					Sign In
				</GradientButton>
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
	</Card>
</div>
