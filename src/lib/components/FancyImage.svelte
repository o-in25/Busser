<script lang="ts">
  export let src: string;
  export let alt: string;
</script>
<div class="rounded-lg border border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 shadow-md flex w-full max-w-sm flex-col">
  <img class="rounded-lg" {src} {alt}>
</div>