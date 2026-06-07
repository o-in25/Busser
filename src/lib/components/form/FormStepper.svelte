<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { Component } from 'svelte';

	import { cn } from '$lib/utils';

	// thin checkmark progress rail — completed steps filled + glow, current ringed, future muted
	let {
		steps,
		currentStep = 0,
		canProceed = true,
		onstep,
	}: {
		steps: { title: string; icon?: Component }[];
		currentStep?: number;
		canProceed?: boolean;
		onstep?: (index: number) => void;
	} = $props();

	function go(i: number) {
		// allow jumping back freely, forward only if the current step is satisfied
		if (i > currentStep && !canProceed) return;
		onstep?.(i);
	}
</script>

<div class="flex w-full items-center">
	{#each steps as s, i (i)}
		{@const SIcon = s.icon}
		{@const done = i < currentStep}
		{@const active = i === currentStep}
		<button
			type="button"
			onclick={() => go(i)}
			aria-label={s.title}
			aria-current={active ? 'step' : undefined}
			class={cn(
				'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
				done && 'bg-primary text-primary-foreground dark:shadow-glow-cyan',
				active && 'bg-primary/15 text-primary ring-2 ring-primary/40 dark:shadow-glow-cyan',
				!done && !active && 'bg-secondary/20 text-muted-foreground hover:bg-secondary/30'
			)}
		>
			{#if done}
				<Check class="h-4 w-4" />
			{:else if SIcon}
				<SIcon class="h-4 w-4" />
			{:else}
				{i + 1}
			{/if}
		</button>
		{#if i < steps.length - 1}
			<div
				class={cn(
					'mx-1.5 h-0.5 flex-1 rounded-full transition-colors duration-300 sm:mx-2',
					i < currentStep ? 'bg-primary' : 'bg-secondary/30'
				)}
			></div>
		{/if}
	{/each}
</div>
