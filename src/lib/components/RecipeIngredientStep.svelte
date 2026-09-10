<script lang="ts">
	import { ArrowLeftRight, Check } from 'lucide-svelte';
	import IngredientThumb from '$lib/components/IngredientThumb.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { convertFromMl, getUnits, topOffPresets } from '$lib/math';
	import type { Substitute } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		class: className,
		categoryName,
		productId,
		productName,
		quantity,
		unit,
		description,
		productImageUrl = null,
		inStock = false,
		matchLabel = null,
		substitutes = [],
		checked = $bindable(false),
	}: {
		class?: string;
		categoryName: string;
		productId: number;
		productName: string;
		quantity: number;
		unit: string;
		description?: string | null;
		productImageUrl?: string | null;
		inStock?: boolean;
		matchLabel?: string | null;
		substitutes?: Substitute[];
		checked?: boolean;
	} = $props();

	// the recipe's default bottle, treated as one more swappable option
	const defaultOption = $derived<Substitute>({
		productId,
		productName,
		imageUrl: productImageUrl,
		inStock,
	});

	// view-only swap: null = showing the default. resets on remount, so a refresh restores the default.
	let selectedProductId = $state<number | null>(null);
	let substituteOpen = $state(false);

	const allOptions = $derived([defaultOption, ...substitutes]);
	const active = $derived(
		allOptions.find((o) => o.productId === selectedProductId) ?? defaultOption
	);
	// the picker shows every option except the one already on the row (so the default reappears once swapped)
	const otherOptions = $derived(allOptions.filter((o) => o.productId !== active.productId));

	function selectOption(opt: Substitute) {
		selectedProductId = opt.productId === defaultOption.productId ? null : opt.productId;
		substituteOpen = false;
	}

	const units = getUnits();
	const displayQuantity = $derived(convertFromMl(unit, quantity));
	const unitLabel = $derived(units[unit]?.i18n(displayQuantity) || unit);

	// the measure that leads the row, e.g. "2 dashes", "2oz", "Splash with"
	const amount = $derived.by(() => {
		const unitLower = unit.toLowerCase();
		if (unitLower === 'top off') {
			const preset = topOffPresets.find((p) => p.ml === quantity);
			return `${preset?.label || 'Top off'} with`;
		}
		const countable = ['dash', 'cube', 'barspoon', 'egg white', 'egg yolk', 'whole egg'];
		if (countable.includes(unitLower)) return `${Math.round(displayQuantity)} ${unitLabel}`;
		return `${displayQuantity}${unitLabel}`;
	});

	// show the specific bottle only when it adds something over the generic name
	const showProduct = $derived(!!active.productName && active.productName !== categoryName);
</script>

<div
	class={cn(
		'flex items-start gap-3 rounded-xl p-3 transition-colors duration-200',
		checked
			? 'bg-primary/5 border border-primary/20'
			: 'border border-transparent hover:bg-accent/40',
		className
	)}
>
	<!-- tile doubles as the check target for the whole ingredient -->
	<button
		type="button"
		class="flex flex-1 items-start gap-3 text-left min-w-0"
		aria-pressed={checked}
		onclick={() => (checked = !checked)}
	>
		<div
			class="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-border/60 shadow-sm"
		>
			<IngredientThumb
				src={active.imageUrl}
				name={categoryName}
				class={cn('h-full w-full text-lg transition-all', checked && 'opacity-40 grayscale')}
			/>
			{#if checked}
				<div class="absolute inset-0 flex items-center justify-center bg-primary/70">
					<Check class="h-5 w-5 text-primary-foreground" />
				</div>
			{/if}
		</div>

		<div class="min-w-0 flex-1 space-y-0.5">
			<!-- primary: muted amount + emphasised ingredient name -->
			<p class={cn('text-base leading-snug', checked && 'line-through opacity-50')}>
				<span class="tabular-nums text-muted-foreground">{amount}</span>
				<span class="font-semibold text-foreground">{categoryName}</span>
			</p>

			<!-- secondary: the specific bottle, plain (no "Using:") -->
			{#if showProduct}
				<p class={cn('text-sm text-muted-foreground', checked && 'line-through opacity-50')}>
					{active.productName}
				</p>
			{/if}

			<!-- description reads as body, not tertiary -->
			{#if description}
				<p class={cn('text-sm text-foreground/80', checked && 'line-through opacity-50')}>
					{description}
				</p>
			{/if}
		</div>
	</button>

	<!-- substitutions replace the old icon legend: only shown when the user's bar has options -->
	{#if substitutes.length > 0}
		<Popover.Root bind:open={substituteOpen}>
			<Popover.Trigger
				class={cn(
					'mt-0.5 inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-foreground',
					selectedProductId !== null
						? 'border-primary/40 text-foreground'
						: 'border-border/70 text-muted-foreground'
				)}
			>
				<ArrowLeftRight class="h-3.5 w-3.5" />
				<span class="hidden sm:inline">Substitute</span>
			</Popover.Trigger>
			<Popover.Content align="end" class="w-72 sm:w-[30rem] lg:w-[34rem]">
				{#if matchLabel}
					<p class="mb-2 text-xs font-medium text-muted-foreground">{matchLabel} works</p>
				{/if}
				<ul class="space-y-1">
					{#each otherOptions as opt (opt.productId)}
						<li>
							<button
								type="button"
								class="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-accent/60"
								onclick={() => selectOption(opt)}
							>
								<IngredientThumb
									src={opt.imageUrl}
									name={opt.productName}
									class="h-8 w-8 flex-shrink-0 rounded-md border border-border/60 text-xs"
								/>
								<span class="min-w-0 flex-1 truncate text-sm text-foreground"
									>{opt.productName}</span
								>
								{#if opt.productId === defaultOption.productId}
									<span class="flex-shrink-0 text-[11px] font-medium text-muted-foreground"
										>Default</span
									>
								{/if}
								{#if opt.inStock}
									<span
										class="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
									>
										<Check class="h-3 w-3" />
										In stock
									</span>
								{:else}
									<span class="flex-shrink-0 text-[11px] text-muted-foreground">Not stocked</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			</Popover.Content>
		</Popover.Root>
	{/if}
</div>
