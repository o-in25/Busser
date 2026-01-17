<script lang="ts">
	import { Button, Heading, P } from 'flowbite-svelte';
	import {
		ArrowRightOutline,
		CartSolid,
		CheckCircleOutline,
		CloseCircleOutline,
		RedoOutline,
	} from 'flowbite-svelte-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

  async function resendEmail() {
    const response = await fetch('/api/mail/user-registration', {
      method: 'POST',
      body: JSON.stringify('{}')
    })

    const result = await response.json();
    console.log(result)
  }
</script>

<div>
	{#if data.status === 'success'}
		<CheckCircleOutline
			class="w-8 h-8 mb-3 text-green-500 dark:text-green-400"
		/>
	{:else}
		<CloseCircleOutline class="w-8 h-8 mb-3 text-red-500 dark:text-red-400" />
	{/if}
	{#if data.status === 'success'}
		<Heading
			tag="h4"
			class="text-xl font-semibold mb-2"
		>
			Your account has been verified!
		</Heading>
	{:else}
		<Heading
			tag="h4"
			class="text-xl font-semibold mb-2"
		>
			Verification failed
		</Heading>
	{/if}
	{#if data.status === 'success'}
		<P class="mb-3 font-normal text-gray-500 dark:text-gray-400">
			Thanks for confirming your email. Your account is now active.
		</P>
	{:else}
		<P class="mb-3 font-normal text-gray-500 dark:text-gray-400">
			Your verification link may have expired or is invalid.
		</P>
	{/if}
  {#if data.status === 'success'}
  	<Button
		class="mt-4"
		href="/login"
    outline
	>
		Login
		<ArrowRightOutline class="ms-2 h-5 w-5" />
	</Button>
  {:else}
  	<Button
		class="mt-4"
    onclick={resendEmail}
    outline
	>
		Resend Email
	</Button>
  {/if}
</div>
