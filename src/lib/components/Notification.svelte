<script lang="ts">
    import { Toast } from "flowbite-svelte";
    import { CheckCircleSolid } from "flowbite-svelte-icons";
    import { notificationStore } from "../../stores";
    import { onMount } from "svelte";

  let message;
  let showNotification = true;
  let seconds = 100;

  notificationStore.subscribe(({ success, error }) => {
    if(!success && !error) return;
    message = success?.message || error?.message;
    trigger()

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

  onMount(() => trigger())
</script>

<Toast position="top-right" bind:toastStatus={showNotification}>
  <svelte:fragment slot="icon">
    <CheckCircleSolid  class="w-5 h-5" />
    <span class="sr-only">Error icon</span>
  </svelte:fragment>
  <div class="ms-3">
    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">New Notification</h4>
    <div class="text-sm font-normal text-gray-900 dark:text-white">{message}</div>
  </div>
</Toast>