<script lang="ts">
	import { ExternalLink, Pencil, Trash2 } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import type { Supplier } from '$lib/types';
	import { titleCase } from '$lib/utils';

	let {
		suppliers,
		productCounts = {},
		canModify = false,
		onEdit,
		onRemove,
	}: {
		suppliers: Supplier[];
		productCounts?: Record<number, number>;
		canModify?: boolean;
		onEdit?: (supplier: Supplier) => void;
		onRemove?: (supplierId: number) => void;
	} = $props();
</script>

<Card.Root bare class="glass-panel isolate">
	<Card.Content class="p-0">
		<div class="overflow-x-auto">
			<Table.Root
				class="[&_th:first-child]:pl-6 [&_td:first-child]:pl-6 [&_th:last-child]:pr-6 [&_td:last-child]:pr-6"
			>
				<Table.Header class="hidden sm:table-header-group">
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head class="hidden sm:table-cell">Type</Table.Head>
						<Table.Head class="hidden md:table-cell">Address</Table.Head>
						<Table.Head class="hidden lg:table-cell">Phone</Table.Head>
						<Table.Head class="hidden lg:table-cell">Website</Table.Head>
						<Table.Head class="text-center">Products</Table.Head>
						{#if canModify}
							<Table.Head class="w-24"></Table.Head>
						{/if}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each suppliers as supplier (supplier.supplierId)}
						<Table.Row>
							<Table.Cell class="font-medium">{supplier.supplierName}</Table.Cell>
							<Table.Cell class="hidden sm:table-cell">
								{#if supplier.supplierTypeName}
									<Badge variant="secondary">{titleCase(supplier.supplierTypeName)}</Badge>
								{:else}
									<span class="text-muted-foreground text-sm">-</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="hidden md:table-cell max-w-xs truncate text-muted-foreground">
								{supplier.supplierAddress || '-'}
							</Table.Cell>
							<Table.Cell class="hidden lg:table-cell text-muted-foreground">
								{#if supplier.supplierPhone}
									<a href="tel:{supplier.supplierPhone}" class="hover:text-foreground">
										{supplier.supplierPhone}
									</a>
								{:else}
									-
								{/if}
							</Table.Cell>
							<Table.Cell class="hidden lg:table-cell">
								{#if supplier.supplierWebsiteUrl}
									<a
										href={supplier.supplierWebsiteUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
									>
										<ExternalLink class="h-3.5 w-3.5" />
										Visit
									</a>
								{:else}
									<span class="text-muted-foreground text-sm">-</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-center tabular-nums">
								{productCounts[supplier.supplierId] || 0}
							</Table.Cell>
							{#if canModify}
								<Table.Cell>
									{#if supplier.supplierIsOwned && !supplier.supplierIsDefault}
										<div class="flex items-center justify-end">
											{#if onEdit}
												<Button
													variant="ghost"
													size="sm"
													class="text-muted-foreground hover:text-foreground"
													onclick={() => onEdit(supplier)}
												>
													<Pencil class="h-4 w-4" />
												</Button>
											{/if}
											{#if onRemove}
												<Button
													variant="ghost"
													size="sm"
													class="text-muted-foreground hover:text-destructive"
													onclick={() => onRemove(supplier.supplierId)}
												>
													<Trash2 class="h-4 w-4" />
												</Button>
											{/if}
										</div>
									{/if}
								</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</Card.Content>
</Card.Root>
