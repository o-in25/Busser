<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';

	onMount(() => {
		// notify other tabs
		const authChannel = new BroadcastChannel('auth');
		authChannel.postMessage('logout');
		authChannel.close();

		goto('/');
	});
</script>

<p>Redirecting...</p>
