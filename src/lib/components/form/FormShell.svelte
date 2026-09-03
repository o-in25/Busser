<script lang="ts">
	import { ChevronLeft, ChevronRight, X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	import AutosaveIndicator from './AutosaveIndicator.svelte';
	import FormStepper from './FormStepper.svelte';

	// one stepped flow for all breakpoints — big step title, thin stepper, sticky glass footer
	// lucide icons are legacy component classes, hence `typeof ChevronLeft` rather than svelte's `Component`
	type StepDef = { id?: string; title: string; icon?: typeof ChevronLeft; optional?: boolean };

	let {
		steps,
		currentStep = $bindable(0),
		canProceed = true,
		isValid = true,
		submitting = false,
		lastSaved = null,
		cancelHref = '/',
		eyebrow,
		submitLabel = 'Save',
		children,
	}: {
		steps: StepDef[];
		currentStep?: number;
		canProceed?: boolean;
		isValid?: boolean;
		submitting?: boolean;
		lastSaved?: Date | null;
		cancelHref?: string;
		eyebrow?: string;
		submitLabel?: string;
		children: Snippet<[{ step: number }]>;
	} = $props();

	let direction = $state(1);
	const isLast = $derived(currentStep >= steps.length - 1);
	const current = $derived(steps[currentStep]);

	function goToStep(i: number) {
		if (i === currentStep) return;
		direction = i > currentStep ? 1 : -1;
		currentStep = i;
	}
	function prev() {
		if (currentStep > 0) {
			direction = -1;
			currentStep--;
		}
	}
	function next() {
		if (!isLast && canProceed) {
			direction = 1;
			currentStep++;
		}
	}
</script>

<!-- mobile: fill the viewport minus the chrome (top header 4rem + safe-area, container/wrapper
     padding above/below, fixed bottom nav's 6rem reserve) so a short form pushes the footer to the
     bottom of the view without reserving room or adding scroll. desktop is untouched (block). -->
<div
	class="mx-auto flex min-h-[calc(100dvh-12rem-env(safe-area-inset-top,0px))] w-full max-w-3xl flex-col md:block md:min-h-0"
>
	<FormStepper {steps} {currentStep} {canProceed} onstep={goToStep} />

	<!-- step heading -->
	<div class="mb-6 mt-6">
		<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
			{eyebrow ? `${eyebrow} · ` : ''}Step {currentStep + 1} of {steps.length}
		</p>
		<h2 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{current?.title}</h2>
		{#if current?.optional}
			<p class="mt-1 text-sm text-muted-foreground">Optional</p>
		{/if}
	</div>

	<!-- active step body -->
	<!-- overflow-x-clip (not hidden) contains the horizontal slide without forcing overflow-y to
	     auto, so field dropdowns can escape downward over the footer instead of being clipped -->
	<!-- flex-1 on mobile absorbs the slack so the footer lands at the bottom, not right under the body -->
	<div class="min-h-[18rem] flex-1 overflow-x-clip md:flex-none">
		{#key currentStep}
			<div
				in:fly={{ x: direction * 160, duration: 220, delay: 180 }}
				out:fly={{ x: direction * -160, duration: 180 }}
			>
				{@render children({ step: currentStep })}
			</div>
		{/key}
	</div>

	<!-- sticky glass footer -->
	<div
		class="glass-panel sticky bottom-4 z-10 mb-4 mt-8 flex items-center gap-3 px-2 py-3 sm:px-3"
	>
		{#if currentStep === 0}
			<Button type="button" variant="outline" class="rounded-full" onclick={() => goto(cancelHref)}>
				<X class="mr-1 h-4 w-4" /> Cancel
			</Button>
		{:else}
			<Button type="button" variant="outline" class="rounded-full" onclick={prev}>
				<ChevronLeft class="mr-1 h-4 w-4" /> Back
			</Button>
		{/if}

		<div class="flex flex-1 justify-center">
			<AutosaveIndicator {lastSaved} />
		</div>

		{#if isLast}
			<Button type="submit" disabled={submitting || !isValid}>
				{submitting ? 'Saving…' : submitLabel}
			</Button>
		{:else}
			<Button type="button" onclick={next} disabled={!canProceed}>
				Next <ChevronRight class="ml-1 h-4 w-4" />
			</Button>
		{/if}
	</div>
</div>
