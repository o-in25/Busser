<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		class: className,
		color = 'gray',
		size = 'md',
		...restProps
	}: {
		class?: string;
		color?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink';
		size?: 'sm' | 'md' | 'lg';
		[key: string]: unknown;
	} = $props();

	const colorClasses: Record<string, string> = {
		gray: 'bg-gray-400',
		red: 'bg-red-500',
		yellow: 'bg-neon-yellow-400',
		green: 'bg-neon-green-500',
		blue: 'bg-blue-500',
		indigo: 'bg-indigo-500',
		purple: 'bg-secondary-500',
		pink: 'bg-primary-500',
	};

	const sizeClasses: Record<string, string> = {
		sm: 'w-2 h-2',
		md: 'w-2.5 h-2.5',
		lg: 'w-3 h-3',
	};
</script>

<span
	class={cn('inline-block rounded-full', colorClasses[color], sizeClasses[size], className)}
	{...restProps}
></span>
