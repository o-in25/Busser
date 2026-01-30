<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils';

	let {
		class: className,
		value = $bindable(0),
		label,
		name,
		icon: Icon,
		color = 'primary',
		min = 0,
		max = 10,
		step = 0.1,
		onchange,
		...restProps
	}: {
		class?: string;
		value?: number;
		label: string;
		name: string;
		icon?: typeof import('lucide-svelte').Candy;
		color?: 'pink' | 'amber' | 'purple' | 'orange' | 'primary';
		min?: number;
		max?: number;
		step?: number;
		onchange?: (value: number) => void;
		[key: string]: unknown;
	} = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = Number(target.value);
		onchange?.(value);
	}

	// Calculate percentage for gradient intensity
	let percentage = $derived(((value - min) / (max - min)) * 100);

	// Color mappings for gradients
	const colorMap = {
		pink: { from: '336 80% 58%', to: '340 87% 45%' },
		amber: { from: '38 92% 50%', to: '32 95% 44%' },
		purple: { from: '271 76% 53%', to: '280 85% 45%' },
		orange: { from: '24 95% 53%', to: '17 88% 40%' },
		primary: { from: 'var(--primary)', to: '340 87% 45%' },
	};

	let colors = $derived(colorMap[color] || colorMap.primary);
</script>

<div class={cn('space-y-2', className)} {...restProps}>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			{#if Icon}
				<Icon
					class="h-4 w-4 transition-all duration-200"
					style="color: hsl({colors.from}); opacity: {0.4 + (percentage / 100) * 0.6}"
				/>
			{/if}
			<Label for={name} class="text-sm font-medium">{label}</Label>
		</div>
		<span
			class="text-sm font-semibold px-2 py-0.5 rounded-full transition-all duration-200"
			style="background: linear-gradient(135deg, hsl({colors.from} / {0.1 +
				(percentage / 100) * 0.2}), hsl({colors.to} / {0.05 +
				(percentage / 100) * 0.15})); color: hsl({colors.from})"
		>
			{value.toFixed(1)}
		</span>
	</div>

	<input type="hidden" {name} {value} />

	<input
		type="range"
		id={name}
		{min}
		{max}
		{step}
		{value}
		oninput={handleInput}
		class="flavor-slider w-full h-2 rounded-full appearance-none cursor-pointer transition-all"
		style="
      --slider-percentage: {percentage}%;
      --color-from: {colors.from};
      --color-to: {colors.to};
    "
	/>
</div>

<style>
	.flavor-slider {
		background: linear-gradient(
			to right,
			hsl(var(--color-from)) 0%,
			hsl(var(--color-from)) var(--slider-percentage),
			hsl(var(--secondary) / 0.3) var(--slider-percentage),
			hsl(var(--secondary) / 0.3) 100%
		);
	}

	.flavor-slider::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		background: linear-gradient(135deg, hsl(var(--color-from)) 0%, hsl(var(--color-to)) 100%);
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.flavor-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
	}

	.flavor-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: linear-gradient(135deg, hsl(var(--color-from)) 0%, hsl(var(--color-to)) 100%);
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.flavor-slider::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
	}
</style>
