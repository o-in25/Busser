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
	} from 'lucide-svelte';
	import type { Snippet } from 'svelte';

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
	}: {
		class?: string;
		currentStep?: number;
		children?: Snippet<[{ step: number; isActive: boolean }]>;
		onfinish?: () => void;
		canProceed?: boolean;
	} = $props();

	const steps: Step[] = [
		{ title: 'Details', icon: BookOpen },
		{ title: 'Description', icon: Image },
		{ title: 'Ingredients', icon: FlaskConical },
		{ title: 'Ratings', icon: Gauge },
		{ title: 'Preparation', icon: Martini },
	];

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
	<!-- Content slot for each step -->
	<div class="min-h-[350px]">
		{#if children}
			{#each steps as step, index}
				<div class={cn(index === currentStep ? 'block' : 'hidden')}>
					<Card.Root>
						<Card.Header class="pb-3">
							<div class="flex items-center justify-between mb-1">
								<Card.Title class="flex items-center gap-2 text-base">
									{@const StepIcon = step.icon}
									<StepIcon class="h-4 w-4 text-primary" />
									{step.title}
								</Card.Title>
								<span class="text-xs text-muted-foreground">
									Step {currentStep + 1} of {steps.length}
								</span>
							</div>
							<div class="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
								<div
									class="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
									style="width: {progress}%"
								></div>
							</div>
							<div class="flex justify-center gap-2 pt-3">
								{#each steps as s, i}
									{@const SIcon = s.icon}
									<button
										type="button"
										class={cn(
											'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 text-xs',
											i === currentStep
												? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
												: i < currentStep
													? 'bg-primary/20 text-primary'
													: 'bg-secondary/30 text-muted-foreground'
										)}
										onclick={() => goToStep(i)}
									>
										{#if i < currentStep}
											<Check class="h-3 w-3" />
										{:else}
											<SIcon class="h-3 w-3" />
										{/if}
									</button>
								{/each}
							</div>
						</Card.Header>
						<Card.Content>
							{@render children({ step: index, isActive: index === currentStep })}
						</Card.Content>
						<Card.Footer class="flex justify-between pt-4 border-t">
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
								<Button
									type="button"
									onclick={nextStep}
									disabled={!canProceed}
									class="flex items-center gap-2"
								>
									Next
									<ChevronRight class="h-4 w-4" />
								</Button>
							{:else}
								<Button type="submit" disabled={!canProceed} class="flex items-center gap-2">
									Save
									<Check class="h-4 w-4" />
								</Button>
							{/if}
						</Card.Footer>
					</Card.Root>
				</div>
			{/each}
		{/if}
	</div>

</div>
