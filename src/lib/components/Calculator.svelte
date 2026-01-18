<script>
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	let selections = [
		{
			value: 'lime',
			name: 'Lime Juice',
			weights: [
				{ key: 'citricAcidWgt', weight: 0.66 },
				{ key: 'malicAcidWgt', weight: 0.33 },
				{ key: 'msgWgt', weight: 0 },
				{ key: 'waterWgt', weight: 16.66 },
			],
		},
		{
			value: 'lemon',
			name: 'Lemon Juice',
			weights: [
				{ key: 'citricAcidWgt', weight: 1 },
				{ key: 'malicAcidWgt', weight: 0 },
				{ key: 'msgWgt', weight: 0 },
				{ key: 'waterWgt', weight: 16.66 },
			],
		},
		{
			value: 'orange',
			name: 'Orange Juice',
			weights: [
				{ key: 'citricAcidWgt', weight: 0.9 },
				{ key: 'malicAcidWgt', weight: 0.1 },
				{ key: 'msgWgt', weight: 0 },
				{ key: 'waterWgt', weight: 16.66 },
			],
		},
		{
			value: 'grapefruit',
			name: 'Grapefruit Juice',
			weights: [
				{ key: 'citricAcidWgt', weight: 0.8 },
				{ key: 'malicAcidWgt', weight: 0.2 },
				{ key: 'msgWgt', weight: 0.033 },
				{ key: 'waterWgt', weight: 16.66 },
			],
		},
	];

	let fields = {
		juiceType: {
			value: 'lime',
			enabled: true,
		},
		initialWgt: {
			value: '0',
			enabled: true,
		},
		citricAcidWgt: {
			value: '0.00',
			enabled: true,
		},
		malicAcidWgt: {
			value: '0.00',
			enabled: true,
		},
		msgWgt: {
			value: '0.00',
			enabled: false,
		},
		waterWgt: {
			value: '0.00',
			enabled: true,
		},
	};

	const calculate = () => {
		const { weights } =
			selections.find(({ value }) => value === fields.juiceType.value) || {};
		const initialValue = parseFloat(fields.initialWgt.value) || 0;
		weights?.forEach(({ key, weight }, i) => {
			fields[key].enabled = weight === 0;
			let value = initialValue * weight;
			value = i === weights.length - 1 ? value / 250 : value;
			fields[key].value = value.toFixed(2);
		});
	};
</script>

<h6 class="text-lg font-bold mb-4">Super Juice Calculator</h6>
<form>
	<div class="flex gap-4 mb-6">
		<div class="flex-1">
			<Label for="input-addon" class="mb-2">Peel Weight</Label>
			<div class="relative">
				<Input
					id="input-addon"
					type="number"
					bind:value={fields.initialWgt.value}
					class="pr-16"
				/>
				<span class="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
					grams
				</span>
			</div>
		</div>
		<div>
			<Label class="mb-2">Juice</Label>
			<select
				class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				bind:value={fields.juiceType.value}
				onchange={calculate}
			>
				{#each selections as item}
					<option value={item.value}>{item.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="grid gap-4 mb-6 md:grid-cols-2">
		<!-- citric acid -->
		<div>
			<Label class="mb-2">Citric Acid</Label>
			<div class="relative">
				<Input type="text" readonly value={fields.citricAcidWgt.value} class="pr-16" />
				<span class="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
					grams
				</span>
			</div>
		</div>

		<!-- malic acid -->
		<div>
			<Label class="mb-2">Malic Acid</Label>
			<div class="relative">
				<Input
					type="text"
					readonly
					disabled={fields.malicAcidWgt.enabled}
					value={fields.malicAcidWgt.value}
					class="pr-16"
				/>
				<span class="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
					grams
				</span>
			</div>
		</div>

		<!-- msg -->
		<div>
			<Label class="mb-2">MSG</Label>
			<div class="relative">
				<Input
					type="text"
					readonly
					disabled={fields.msgWgt.enabled}
					value={fields.msgWgt.value}
					class="pr-16"
				/>
				<span class="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
					grams
				</span>
			</div>
		</div>

		<!-- water -->
		<div>
			<Label class="mb-2">Water</Label>
			<div class="relative">
				<Input type="text" readonly value={fields.waterWgt.value} class="pr-16" />
				<span class="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
					cups
				</span>
			</div>
		</div>

		<div class="mt-4 flex">
			<div class="flex-grow">
				<Button onclick={calculate}>Calculate</Button>
			</div>
		</div>
	</div>
</form>
