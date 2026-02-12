<script lang="ts">
	import { Calculator, Citrus, Droplets, FlaskConical, Scale, Sparkles } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';

	let selections = [
		{
			value: 'lime',
			name: 'Lime',
			weights: [
				{ key: 'citricAcidWgt', weight: 0.66 },
				{ key: 'malicAcidWgt', weight: 0.33 },
				{ key: 'msgWgt', weight: 0 },
				{ key: 'waterWgt', weight: 16.66 },
			],
		},
		{
			value: 'lemon',
			name: 'Lemon',
			weights: [
				{ key: 'citricAcidWgt', weight: 1 },
				{ key: 'malicAcidWgt', weight: 0 },
				{ key: 'msgWgt', weight: 0 },
				{ key: 'waterWgt', weight: 16.66 },
			],
		},
		{
			value: 'orange',
			name: 'Orange',
			weights: [
				{ key: 'citricAcidWgt', weight: 0.9 },
				{ key: 'malicAcidWgt', weight: 0.1 },
				{ key: 'msgWgt', weight: 0 },
				{ key: 'waterWgt', weight: 16.66 },
			],
		},
		{
			value: 'grapefruit',
			name: 'Grapefruit',
			weights: [
				{ key: 'citricAcidWgt', weight: 0.8 },
				{ key: 'malicAcidWgt', weight: 0.2 },
				{ key: 'msgWgt', weight: 0.033 },
				{ key: 'waterWgt', weight: 16.66 },
			],
		},
	];

	let selectedJuice = $state('lime');
	let peelWeight = $state('0');

	let results = $state({
		citricAcid: '0.00',
		malicAcid: '0.00',
		msg: '0.00',
		water: '0.00',
		malicEnabled: true,
		msgEnabled: false,
	});

	let hasCalculated = $state(false);

	function handleJuiceChange(value: string) {
		selectedJuice = value;
		if (hasCalculated) {
			calculate();
		}
	}

	const calculate = () => {
		const selection = selections.find(({ value }) => value === selectedJuice);
		if (!selection) return;

		const initialValue = parseFloat(peelWeight) || 0;
		const { weights } = selection;

		weights.forEach(({ key, weight }, i) => {
			let value = initialValue * weight;
			value = i === weights.length - 1 ? value / 250 : value;

			if (key === 'citricAcidWgt') results.citricAcid = value.toFixed(2);
			if (key === 'malicAcidWgt') {
				results.malicAcid = value.toFixed(2);
				results.malicEnabled = weight > 0;
			}
			if (key === 'msgWgt') {
				results.msg = value.toFixed(2);
				results.msgEnabled = weight > 0;
			}
			if (key === 'waterWgt') results.water = value.toFixed(2);
		});

		hasCalculated = true;
	};

	const selectedName = $derived(selections.find((s) => s.value === selectedJuice)?.name || 'Lime');
</script>

<div class="space-y-6">
	<!-- Input Section -->
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-2">
			<Label for="peel-weight" class="flex items-center gap-2">
				<Scale class="h-4 w-4 text-muted-foreground" />
				Peel Weight
			</Label>
			<div class="relative">
				<Input
					id="peel-weight"
					type="number"
					bind:value={peelWeight}
					placeholder="Enter weight"
					class="pr-16"
				/>
				<span
					class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
				>
					grams
				</span>
			</div>
		</div>

		<div class="space-y-2">
			<Label class="flex items-center gap-2">
				<Citrus class="h-4 w-4 text-muted-foreground" />
				Citrus Type
			</Label>
			<Select.Root type="single" value={selectedJuice} onValueChange={handleJuiceChange}>
				<Select.Trigger class="w-full">
					<Select.Value placeholder="Select citrus...">{selectedName}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					{#each selections as item}
						<Select.Item value={item.value} label={item.name}>
							<!-- <span class="mr-2">{item.icon}</span> -->
							{item.name}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<!-- Calculate Button -->
	<Button onclick={calculate} class="w-full sm:w-auto">
		<Calculator class="h-4 w-4 mr-2" />
		Calculate Recipe
	</Button>

	<!-- Results Section -->
	{#if hasCalculated}
		<div class="pt-4 border-t">
			<div class="flex items-center gap-2 mb-4">
				<Sparkles class="h-4 w-4 text-primary" />
				<span class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
					>Recipe Results</span
				>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<!-- Citric Acid -->
				<div
					class="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20"
				>
					<FlaskConical class="h-5 w-5 text-amber-500 shrink-0" />
					<div class="flex-1 min-w-0">
						<p class="text-xs text-muted-foreground">Citric Acid</p>
						<p class="text-lg font-bold">
							{results.citricAcid}
							<span class="text-sm font-normal text-muted-foreground">grams</span>
						</p>
					</div>
				</div>

				<!-- Malic Acid -->
				<div
					class="flex items-center gap-3 p-4 rounded-lg {results.malicEnabled
						? 'bg-pink-500/10 border border-pink-500/20'
						: 'bg-muted/30 border border-muted'}"
				>
					<FlaskConical
						class="h-5 w-5 {results.malicEnabled
							? 'text-pink-500'
							: 'text-muted-foreground/50'} shrink-0"
					/>
					<div class="flex-1 min-w-0">
						<p class="text-xs text-muted-foreground">Malic Acid</p>
						{#if results.malicEnabled}
							<p class="text-lg font-bold">
								{results.malicAcid}
								<span class="text-sm font-normal text-muted-foreground">grams</span>
							</p>
						{:else}
							<p class="text-sm text-muted-foreground">Not needed</p>
						{/if}
					</div>
				</div>

				<!-- MSG -->
				<div
					class="flex items-center gap-3 p-4 rounded-lg {results.msgEnabled
						? 'bg-purple-500/10 border border-purple-500/20'
						: 'bg-muted/30 border border-muted'}"
				>
					<Sparkles
						class="h-5 w-5 {results.msgEnabled
							? 'text-purple-500'
							: 'text-muted-foreground/50'} shrink-0"
					/>
					<div class="flex-1 min-w-0">
						<p class="text-xs text-muted-foreground">MSG (optional)</p>
						{#if results.msgEnabled}
							<p class="text-lg font-bold">
								{results.msg} <span class="text-sm font-normal text-muted-foreground">grams</span>
							</p>
						{:else}
							<p class="text-sm text-muted-foreground">Not needed</p>
						{/if}
					</div>
				</div>

				<!-- Water -->
				<div
					class="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
				>
					<Droplets class="h-5 w-5 text-blue-500 shrink-0" />
					<div class="flex-1 min-w-0">
						<p class="text-xs text-muted-foreground">Water</p>
						<p class="text-lg font-bold">
							{results.water} <span class="text-sm font-normal text-muted-foreground">cups</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Instructions hint -->
	{#if !hasCalculated}
		<div class="p-4 rounded-lg bg-muted/30 border border-dashed">
			<p class="text-sm text-muted-foreground">
				<strong>How to use:</strong> Weigh your citrus peels, select the citrus type, and click calculate
				to get the precise amounts of acids and water needed for your super juice.
			</p>
		</div>
	{/if}
</div>
