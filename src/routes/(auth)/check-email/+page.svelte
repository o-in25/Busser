<script lang="ts">
	import { Card, Heading, P } from 'flowbite-svelte';
    import type { PageData } from './$types';
	import { GiftBoxSolid, ArrowUpRightFromSquareOutline, CheckCircleOutline } from 'flowbite-svelte-icons';

    let { data }: { data: PageData } = $props();
    let email = 'test@test.com'
</script>
<svelte:head>
	<title>Check Email - Busser</title>
</svelte:head>
<div>
  <CheckCircleOutline class="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />

  <Heading tag="h4" class="text-xl font-semibold mb-2">Check your email</Heading>
  <P class="mb-3 font-normal text-gray-500 dark:text-gray-400">
    We’ve sent a verification link to <strong>{email || 'your email address'}</strong>.
    Please click the link to complete your registration.
  </P>
</div>