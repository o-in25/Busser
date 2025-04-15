<script>
	import { AngleRightOutline } from 'flowbite-svelte-icons';
	export let name;
	export let href = '';
</script>

<li class="inline-flex items-center">
	<div class="text-gray-500 dark:text-gray-400">
		<AngleRightOutline />
	</div>
	{#if href}
		<a
			{href}
			class="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
		>
			{name}
		</a>
	{:else}
		<span
			class="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400"
		>
			{name}
		</span>
	{/if}
</li>
