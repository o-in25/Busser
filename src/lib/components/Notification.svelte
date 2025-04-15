<script lang="ts">
	import { Toast } from 'flowbite-svelte';
	import { CheckCircleSolid } from 'flowbite-svelte-icons';
	import { notificationStore } from '../../stores';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	let message;
	let showNotification = false;
	let seconds = 100;
	let color: 'green' | 'red' | 'purple' = 'purple';

	notificationStore.subscribe(({ success, error }) => {
		if (!success && !error) return;
		message = success?.message || error?.message;
		if (success?.message) color = 'green';
		if (error?.message) color = 'red';

		trigger();
	});

	function trigger() {
		seconds = 100;
		showNotification = true;
		timeout();
	}

	function timeout() {
		if (--seconds > 0) return setTimeout(timeout, seconds);
		showNotification = false;
		$notificationStore.success = null;
		$notificationStore.error = null;
	}

	// onMount(() => trigger())
</script>

{#if color === 'green'}
	<Toast
		position="top-right"
		bind:toastStatus={showNotification}
		color="green"
		transition={fly}
		params={{ x: 200 }}
		class="mb-4"
	>
		<svelte:fragment slot="icon">
			<CheckCircleSolid class="w-5 h-5" />
			<span class="sr-only">Error icon</span>
		</svelte:fragment>
		<div class="ms-3">
			<h4 class="text-sm font-semibold text-gray-900 dark:text-white">
				Success
			</h4>
			<div class="text-sm font-normal text-gray-900 dark:text-white">
				{message}
			</div>
		</div>
	</Toast>
{:else if color === 'red'}
	<Toast
		position="top-right"
		bind:toastStatus={showNotification}
		color="red"
		transition={fly}
		params={{ x: 200 }}
		class="mb-4"
	>
		<svelte:fragment slot="icon">
			<CheckCircleSolid class="w-5 h-5" />
			<span class="sr-only">Error icon</span>
		</svelte:fragment>
		<div class="ms-3">
			<h4 class="text-sm font-semibold text-gray-900 dark:text-white">Error</h4>
			<div class="text-sm font-normal text-gray-900 dark:text-white">
				{message}
			</div>
		</div>
	</Toast>
{:else}
	<Toast
		position="top-right"
		bind:toastStatus={showNotification}
		transition={fly}
		params={{ x: 200 }}
		color="green"
		class="mb-4"
	>
		<svelte:fragment slot="icon">
			<CheckCircleSolid class="w-5 h-5" />
			<span class="sr-only">Error icon</span>
		</svelte:fragment>
		<div class="ms-3">
			<h4 class="text-sm font-semibold text-gray-900 dark:text-white">
				New Notification
			</h4>
			<div class="text-sm font-normal text-gray-900 dark:text-white">
				{message}
			</div>
		</div>
	</Toast>
{/if}
