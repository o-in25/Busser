<script lang="ts">
	import { Check, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	type Step = {
		title: string;
		icon?: typeof import('lucide-svelte').ChevronLeft;
	};

	let {
		class: className,
		steps,
		currentStep = $bindable(0),
		children,
		onfinish,
	}: {
		class?: string;
		steps: Step[];
		currentStep?: number;
		children?: Snippet<[{ step: number; isActive: boolean }]>;
		onfinish?: () => void;
	} = $props();

	let progress = $derived(((currentStep + 1) / steps.length) * 100);

	function prevStep() {
		if (currentStep > 0) currentStep--;
	}

	function nextStep() {
		if (currentStep < steps.length - 1) {
			currentStep++;
		} else {
			onfinish?.();
		}
	}

	function goToStep(index: number) {
		currentStep = index;
	}
</script>

<div class={cn('md:hidden', className)}>
	<!-- Progress bar -->
	<div class="mb-4">
		<div class="flex items-center justify-between mb-2">
			<span class="text-sm font-medium text-foreground">
				Step {currentStep + 1} of {steps.length}
			</span>
			<span class="text-sm text-muted-foreground">
				{steps[currentStep]?.title}
			</span>
		</div>
		<div class="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
			<div
				class="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
				style="width: {progress}%"
			></div>
		</div>
	</div>

	<!-- Step indicators -->
	<div class="flex justify-center gap-2 mb-6">
		{#each steps as step, index}
			<button
				type="button"
				class={cn(
					'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
					index === currentStep
						? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
						: index < currentStep
							? 'bg-primary/20 text-primary'
							: 'bg-secondary/30 text-muted-foreground'
				)}
				onclick={() => goToStep(index)}
			>
				{#if index < currentStep}
					<Check class="h-4 w-4" />
				{:else if step.icon}
					{@const StepIcon = step.icon}
					<StepIcon class="h-4 w-4" />
				{:else}
					{index + 1}
				{/if}
			</button>
		{/each}
	</div>

	<!-- Content slot for each step -->
	<div class="min-h-[300px]">
		{#if children}
			{#each steps as _, index}
				<div class={cn(index === currentStep ? 'block' : 'hidden')}>
					{@render children({ step: index, isActive: index === currentStep })}
				</div>
			{/each}
		{/if}
	</div>

	<!-- Navigation buttons -->
	<div class="flex justify-between mt-6 pt-4 border-t">
		<Button
			type="button"
			variant="outline"
			onclick={prevStep}
			disabled={currentStep === 0}
			class="flex items-center gap-2"
		>
			<ChevronLeft class="h-4 w-4" />
			Previous
		</Button>

		{#if currentStep < steps.length - 1}
			<Button type="button" onclick={nextStep} class="flex items-center gap-2">
				Next
				<ChevronRight class="h-4 w-4" />
			</Button>
		{:else}
			<Button type="submit" class="flex items-center gap-2">
				Save
				<Check class="h-4 w-4" />
			</Button>
		{/if}
	</div>
</div>
