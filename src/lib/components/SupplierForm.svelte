<script lang="ts">
	import { Store } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import NearbyStoreSearch from '$lib/components/NearbyStoreSearch.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Helper } from '$lib/components/ui/helper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { QuickSelect } from '$lib/components/ui/quick-select';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { ComponentAction, PlaceResult, SelectOption, Supplier } from '$lib/types';

	import { notificationStore } from '../../stores';

	let {
		action = 'add',
		supplier = null,
	}: {
		action?: ComponentAction;
		supplier?: Supplier | null;
	} = $props();

	// supplier types come from the db (value = type name, which the action resolves to the FK)
	let typeOptions = $state<{ label: string; value: string }[]>([]);

	// 'liquor_store' -> 'Liquor store'
	const prettify = (typeName: string) =>
		(typeName.charAt(0).toUpperCase() + typeName.slice(1)).replace(/_/g, ' ');

	onMount(async () => {
		const res = await fetch('/api/select/suppliertypes');
		const types: SelectOption[] = await res.json();
		typeOptions = types.map((t) => ({ label: prettify(String(t.name)), value: String(t.name) }));
	});

	let name = $state('');
	let type = $state('liquor_store');
	let details = $state('');
	let website = $state('');
	let phone = $state('');
	let address = $state('');
	let placeId = $state('');
	let touchedName = $state(false);
	let isSubmitting = $state(false);

	// (re)seed the form whenever we're pointed at a different supplier
	let seededId: number | undefined;
	$effect(() => {
		if (supplier?.supplierId === seededId) return;
		seededId = supplier?.supplierId;
		name = supplier?.supplierName ?? '';
		type = supplier?.supplierTypeName ?? 'liquor_store';
		details = supplier?.supplierDetails ?? '';
		website = supplier?.supplierWebsiteUrl ?? '';
		phone = supplier?.supplierPhone ?? '';
		address = supplier?.supplierAddress ?? '';
		placeId = supplier?.supplierPlaceId ?? '';
	});

	// homemade suppliers have no storefront, so hide address/phone/website
	const isHomemade = $derived(type === 'homemade');
	const isValid = $derived(!!name.trim());

	// prefill the form from a picked google places result
	function prefillFromPlace(place: PlaceResult) {
		name = place.name;
		address = place.address ?? '';
		phone = place.phone ?? '';
		website = place.website ?? '';
		placeId = place.placeId ?? '';
		type = 'liquor_store';
	}
</script>

<div class="space-y-6">
	{#if action === 'add'}
		<Card.Root>
			<Card.Content class="pt-6">
				<NearbyStoreSearch onAdd={prefillFromPlace} />
			</Card.Content>
		</Card.Root>
	{/if}

	<form
		class="relative space-y-6"
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result }) => {
				isSubmitting = false;
				if (result.type === 'redirect') {
					goto(result.location);
				} else {
					await applyAction(result);
					if (result.type === 'failure') {
						$notificationStore.error = {
							message: result?.data?.error?.toString() || 'An error occurred.',
						};
					}
					if (result.type === 'success') {
						$notificationStore.success = {
							message: action === 'add' ? 'Supplier created.' : 'Supplier updated.',
						};
					}
				}
			};
		}}
	>
		<!-- hidden fields serialized from state -->
		<input type="hidden" name="type" value={type} />
		<input type="hidden" name="placeId" value={placeId} />

		<Card.Root>
			<Card.Header class="pb-4">
				<Card.Title class="flex items-center gap-2 text-lg">
					<Store class="h-5 w-5 text-primary" />
					Supplier Details
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div>
					<Label for="name" class="mb-2">
						Name <span class="text-destructive">*</span>
					</Label>
					<Input
						id="name"
						name="name"
						required
						bind:value={name}
						onblur={() => (touchedName = true)}
						class={touchedName && !name.trim() ? 'border-destructive' : ''}
					/>
					{#if touchedName && !name.trim()}
						<Helper color="red">Name is required</Helper>
					{/if}
				</div>

				<div>
					<Label class="mb-2">Type</Label>
					<QuickSelect options={typeOptions} bind:value={type} />
					<p class="text-xs text-muted-foreground mt-2">
						Choose <span class="font-medium">Homemade</span> for things you make in-house — syrups, juices,
						cordials.
					</p>
				</div>

				<div>
					<Label for="details" class="mb-2">Details</Label>
					<Textarea id="details" name="details" bind:value={details} rows={2} />
				</div>

				{#if !isHomemade}
					<div>
						<Label for="address" class="mb-2">Address</Label>
						<Input id="address" name="address" bind:value={address} />
					</div>
					<div>
						<Label for="phone" class="mb-2">Phone</Label>
						<Input id="phone" name="phone" type="tel" bind:value={phone} />
					</div>
					<div>
						<Label for="website" class="mb-2">Website</Label>
						<Input
							id="website"
							name="website"
							type="url"
							bind:value={website}
							placeholder="https://"
						/>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<div class="flex justify-end gap-3">
			<Button type="button" variant="outline" onclick={() => goto('/inventory/suppliers')}>
				Cancel
			</Button>
			<Button type="submit" disabled={isSubmitting || !isValid}>
				{isSubmitting ? 'Saving...' : action === 'add' ? 'Create' : 'Save'}
			</Button>
		</div>
	</form>
</div>
