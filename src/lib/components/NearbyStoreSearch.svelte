<script lang="ts">
	import { Loader2, MapPin, Plus, Star } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { PlaceResult } from '$lib/types';

	let {
		onAdd,
	}: {
		onAdd: (place: PlaceResult) => void;
	} = $props();

	let loading = $state(false);
	let results = $state<PlaceResult[]>([]);
	let error = $state('');
	let searched = $state(false);
	let savingId = $state<string | null>(null);

	async function searchNearby() {
		loading = true;
		error = '';
		results = [];

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: false,
					timeout: 10000,
				});
			});

			const { latitude, longitude } = position.coords;

			// cache coords
			localStorage.setItem(
				'busser-location',
				JSON.stringify({ lat: latitude, lng: longitude })
			);

			const res = await fetch(
				`/api/suppliers/nearby?lat=${latitude}&lng=${longitude}`
			);

			if (!res.ok) throw new Error('Search failed');
			results = await res.json();
			searched = true;
		} catch (err: any) {
			if (err?.code === 1) {
				error = 'Location permission denied. Please enable location access and try again.';
			} else {
				error = err?.message || 'Failed to search nearby stores.';
			}
		} finally {
			loading = false;
		}
	}

	async function handleAdd(place: PlaceResult) {
		savingId = place.placeId;
		try {
			onAdd(place);
			results = results.filter((r) => r.placeId !== place.placeId);
		} finally {
			savingId = null;
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">Nearby Stores</h2>
		<Button
			variant="outline"
			size="sm"
			onclick={searchNearby}
			disabled={loading}
		>
			{#if loading}
				<Loader2 class="h-4 w-4 mr-2 animate-spin" />
				Searching...
			{:else}
				<MapPin class="h-4 w-4 mr-2" />
				Find nearby stores
			{/if}
		</Button>
	</div>

	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}

	{#if results.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each results as place (place.placeId)}
				<Card.Root class="hover:shadow-md transition-all duration-200">
					<Card.Content class="p-4">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<h3 class="font-medium truncate">{place.name}</h3>
								<p class="text-sm text-muted-foreground truncate mt-0.5">
									{place.address}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								class="shrink-0"
								onclick={() => handleAdd(place)}
								disabled={savingId === place.placeId}
							>
								{#if savingId === place.placeId}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<Plus class="h-4 w-4" />
								{/if}
							</Button>
						</div>

						<div class="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
							{#if place.rating}
								<span class="flex items-center gap-1">
									<Star class="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
									{place.rating}
								</span>
							{/if}
							{#if place.openNow !== undefined}
								<span class={place.openNow ? 'text-neon-green-500' : 'text-red-500'}>
									{place.openNow ? 'Open now' : 'Closed'}
								</span>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{:else if searched && !loading}
		<p class="text-sm text-muted-foreground text-center py-4">
			No liquor stores found nearby. Try expanding your search area.
		</p>
	{/if}
</div>
