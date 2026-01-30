<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';

	// If someone navigates here directly via GET, redirect to home
	onMount(() => {
		goto('/');
	});
</script>

<p>Redirecting...</p>
