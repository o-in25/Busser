<script lang="ts">
	import { CheckCircle2, XCircle, Bell } from 'lucide-svelte';
	import { notificationStore } from '../../stores';
	import { fly } from 'svelte/transition';

	let message: string | undefined;
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

	function close() {
		showNotification = false;
		$notificationStore.success = null;
		$notificationStore.error = null;
	}
</script>

{#if showNotification}
	<div
		class="fixed top-4 right-4 z-50"
		transition:fly={{ x: 200, duration: 300 }}
	>
		<div
			class="w-full max-w-xs p-4 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/70 border border-white/30 dark:border-zinc-700/40 shadow-2xl rounded-xl text-gray-500 dark:text-gray-400 flex items-start gap-3"
			role="alert"
		>
			<div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg {
				color === 'green'
					? 'text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200'
					: color === 'red'
						? 'text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200'
						: 'text-primary-500 bg-primary-100 dark:bg-primary-800 dark:text-primary-200'
			}">
				{#if color === 'green'}
					<CheckCircle2 class="w-5 h-5" />
				{:else if color === 'red'}
					<XCircle class="w-5 h-5" />
				{:else}
					<Bell class="w-5 h-5" />
				{/if}
				<span class="sr-only">Notification icon</span>
			</div>
			<div class="flex-1">
				<h4 class="text-sm font-semibold text-gray-900 dark:text-white">
					{color === 'green' ? 'Success' : color === 'red' ? 'Error' : 'Notification'}
				</h4>
				<div class="text-sm font-normal text-gray-900 dark:text-white">
					{message}
				</div>
			</div>
			<button
				type="button"
				class="ms-auto -mx-1.5 -my-1.5 bg-white/50 dark:bg-zinc-800/50 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 dark:hover:text-white inline-flex items-center justify-center h-8 w-8"
				aria-label="Close"
				onclick={close}
			>
				<span class="sr-only">Close</span>
				<XCircle class="w-4 h-4" />
			</button>
		</div>
	</div>
{/if}
