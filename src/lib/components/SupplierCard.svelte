<script lang="ts">
	import { ExternalLink, MapPin, Phone, Trash2 } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { Supplier } from '$lib/types';

	let {
		supplier,
		productCount = 0,
		canModify = false,
		onRemove,
	}: {
		supplier: Supplier;
		productCount?: number;
		canModify?: boolean;
		onRemove?: (supplierId: number) => void;
	} = $props();
</script>

<Card.Root class="hover:shadow-md transition-all duration-200">
	<Card.Content class="p-4">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0">
				<h3 class="font-semibold truncate">{supplier.supplierName}</h3>
				{#if supplier.supplierAddress}
					<p class="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
						<MapPin class="h-3.5 w-3.5 shrink-0" />
						<span class="truncate">{supplier.supplierAddress}</span>
					</p>
				{/if}
			</div>

			{#if canModify && onRemove && supplier.supplierId !== 1}
				<Button
					variant="ghost"
					size="sm"
					class="shrink-0 text-muted-foreground hover:text-destructive"
					onclick={() => onRemove(supplier.supplierId)}
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			{/if}
		</div>

		<div class="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
			{#if supplier.supplierPhone}
				<a
					href="tel:{supplier.supplierPhone}"
					class="flex items-center gap-1 hover:text-foreground transition-colors"
				>
					<Phone class="h-3.5 w-3.5" />
					{supplier.supplierPhone}
				</a>
			{/if}
			{#if supplier.supplierWebsiteUrl}
				<a
					href={supplier.supplierWebsiteUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-1 hover:text-foreground transition-colors"
				>
					<ExternalLink class="h-3.5 w-3.5" />
					Website
				</a>
			{/if}
		</div>

		{#if productCount > 0}
			<p class="text-xs text-muted-foreground mt-2">
				{productCount} product{productCount !== 1 ? 's' : ''} assigned
			</p>
		{/if}
	</Card.Content>
</Card.Root>
