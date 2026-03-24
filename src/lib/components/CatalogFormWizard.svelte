<script lang="ts">
	import {
		BookOpen,
		Check,
		ChevronLeft,
		ChevronRight,
		FlaskConical,
		Gauge,
		Image,
		Martini,
		X,
	} from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { cn } from '$lib/utils';

	type Step = {
		title: string;
		icon: typeof ChevronLeft;
	};

	let {
		class: className,
		currentStep = $bindable(0),
		children,
		onfinish,
		canProceed = true,
		cancelHref = '/',
	}: {
		class?: string;
		currentStep?: number;
		children?: Snippet<[{ step: number; isActive: boolean }]>;
		onfinish?: () => void;
		canProceed?: boolean;
		cancelHref?: string;
	} = $props();

	const steps: Step[] = [
		{ title: 'Details', icon: BookOpen },
		{ title: 'Description', icon: Image },
		{ title: 'Ingredients', icon: FlaskConical },
		{ title: 'Ratings', icon: Gauge },
		{ title: 'Preparation', icon: Martini },
	];

	let direction = $state(1);

	function prevStep() {
		if (currentStep > 0) { direction = -1; currentStep--; }
	}

	function nextStep() {
		if (currentStep < steps.length - 1) {
			direction = 1;
			currentStep++;
		} else {
			onfinish?.();
		}
	}

	function goToStep(index: number) {
		direction = index > currentStep ? 1 : -1;
		currentStep = index;
	}
</script>

<div class={cn('md:hidden', className)}>
	<!-- row 1: step navigation -->
	<div class="flex items-center justify-between gap-2 mb-2">
		<Button
			type="button"
			variant="outline"
			onclick={prevStep}
			disabled={currentStep === 0}
			class="h-10 w-10 p-0 shrink-0"
		>
			<ChevronLeft class="h-5 w-5" />
		</Button>
		<div class="flex items-center justify-center gap-2 flex-1">
			{#each steps as s, i}
				{@const SIcon = s.icon}
				<button
					type="button"
					class={cn(
						'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 text-xs',
						i === currentStep
							? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
							: i < currentStep
								? 'bg-primary/20 text-primary'
								: 'bg-secondary/30 text-muted-foreground'
					)}
					onclick={() => goToStep(i)}
				>
					{#if i < currentStep}
						<Check class="h-3.5 w-3.5" />
					{:else}
						<SIcon class="h-3.5 w-3.5" />
					{/if}
				</button>
			{/each}
		</div>
		<Button
			type="button"
			variant="outline"
			onclick={nextStep}
			disabled={currentStep === steps.length - 1 || !canProceed}
			class="h-10 w-10 p-0 shrink-0"
		>
			<ChevronRight class="h-5 w-5" />
		</Button>
	</div>

	<!-- step label -->
	<p class="text-center text-xs text-muted-foreground mb-2">
		Step {currentStep + 1} of {steps.length} &mdash; {steps[currentStep].title}
	</p>

	<!-- row 2: form actions -->
	<div class="flex gap-3 mb-3">
		<Button
			type="button"
			variant="outline"
			size="sm"
			onclick={() => goto(cancelHref)}
			class="flex-1"
		>
			<X class="h-4 w-4 mr-1" />
			Cancel
		</Button>
		<Button
			type="submit"
			size="sm"
			disabled={currentStep < steps.length - 1 || !canProceed}
			class="flex-1"
		>
			Save
		</Button>
	</div>

	<!-- form content card -->
	<Card.Root>
		<Card.Content class="pt-6">
			{#if children}
				<div class="overflow-x-hidden">
					{#key currentStep}
						<div
							in:fly={{ x: direction * 200, duration: 250, delay: 250 }}
							out:fly={{ x: direction * -200, duration: 250 }}
						>
							{@render children({ step: currentStep, isActive: true })}
						</div>
					{/key}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
