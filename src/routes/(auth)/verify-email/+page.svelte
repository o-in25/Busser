<script lang="ts">
	import { CheckCircle2 } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div>
	<CheckCircle2 class="w-8 h-8 mb-3 text-green-500 dark:text-green-400" />
	<h4 class="text-xl font-semibold mb-2">
		Check your email
	</h4>
	<p class="mb-3 font-normal text-muted-foreground">
		Thanks for signing up! We've sent a confirmation link to your inbox. Click
		the link in that email to verify your address and complete your
		registration.
	</p>
</div>
