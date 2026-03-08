<script lang="ts">
	import { ChevronDown, CheckCheck } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	import ShoppingListItemComponent from '$lib/components/ShoppingListItem.svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import type { ShoppingListItem } from '$lib/types';

	let {
		label,
		items,
		checkedIds,
		onToggle,
		onCheckAll,
	}: {
		label: string;
		items: ShoppingListItem[];
		checkedIds: Set<number>;
		onToggle: (productId: number, checked: boolean) => void;
		onCheckAll: (productIds: number[]) => void;
	} = $props();

	let open = $state(true);

	const allChecked = $derived(items.every((i) => checkedIds.has(i.productId)));
	const subtotal = $derived(items.reduce((sum, i) => sum + i.productPricePerUnit, 0));
	const checkedCount = $derived(items.filter((i) => checkedIds.has(i.productId)).length);
</script>

<div class="rounded-xl border bg-card/50 overflow-hidden">
	<button
		type="button"
		class="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
		onclick={() => (open = !open)}
	>
		<div class="flex items-center gap-2">
			<ChevronDown
				class={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
			/>
			<span class="font-semibold">{label}</span>
			<span class="text-sm text-muted-foreground">
				({checkedCount}/{items.length})
			</span>
		</div>
		<div class="flex items-center gap-3">
			{#if subtotal > 0}
				<span class="text-sm text-muted-foreground tabular-nums">
					${subtotal.toFixed(2)}
				</span>
			{/if}
		</div>
	</button>

	{#if open}
		<div transition:slide={{ duration: 200 }}>
			<div class="px-4 pb-3 space-y-2">
				{#if !allChecked && items.length > 1}
					<div class="flex justify-end">
						<Button
							variant="ghost"
							size="sm"
							class="text-xs h-7"
							onclick={() => onCheckAll(items.map((i) => i.productId))}
						>
							<CheckCheck class="h-3.5 w-3.5 mr-1" />
							Check all
						</Button>
					</div>
				{/if}
				{#each items as item (item.productId)}
					<ShoppingListItemComponent
						{item}
						checked={checkedIds.has(item.productId)}
						{onToggle}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>
