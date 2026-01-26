<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // If someone navigates here directly via GET, redirect to home
  onMount(() => {
    goto('/');
  });
</script>

<p>Redirecting...</p>
