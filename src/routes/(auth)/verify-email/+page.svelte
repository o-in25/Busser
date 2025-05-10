<script lang="ts">
	import { Heading, P } from 'flowbite-svelte';
	import { CheckCircleOutline } from 'flowbite-svelte-icons';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>


<div>
	<CheckCircleOutline class="w-8 h-8 mb-3 text-green-500 dark:text-green-400" />
	<Heading
		tag="h4"
		class="text-xl font-semibold mb-2"
	>
		Check your email
	</Heading>
	<P class="mb-3 font-normal text-gray-500 dark:text-gray-400">
		Thanks for signing up! We’ve sent a confirmation link to your inbox. Click
		the link in that email to verify your address and complete your
		registration.
	</P>
</div>
