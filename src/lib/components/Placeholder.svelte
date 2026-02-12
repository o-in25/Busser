<script lang="ts">
	let {
		id,
		src = '',
		size = 'md',
	}: { id: string; src?: string; size?: 'sm' | 'md' | 'lg' } = $props();

	const sizeClasses = {
		sm: 'w-8 h-8',
		md: 'w-10 h-10',
		lg: 'w-12 h-12',
	};

	const iconSizeClasses = {
		sm: 'w-10 h-10',
		md: 'w-12 h-12',
		lg: 'w-14 h-14',
	};
</script>

<div
	{id}
	class="cursor-pointer relative {sizeClasses[
		size
	]} overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600"
>
	{#if src}
		<img {src} alt="Avatar" class="w-full h-full object-cover" />
	{:else}
		<svg
			class="absolute {iconSizeClasses[size]} text-gray-400 -left-1"
			fill="currentColor"
			viewBox="0 0 20 20"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill-rule="evenodd"
				d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
				clip-rule="evenodd"
			></path>
		</svg>
	{/if}
</div>
