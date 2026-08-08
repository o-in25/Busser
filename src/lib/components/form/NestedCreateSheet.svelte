<script lang="ts">
	import { getContext } from 'svelte';

	import * as Sheet from '$lib/components/ui/sheet';
	import { NESTED_CREATE_KEY, type NestedCreateStack } from '$lib/stores/nestedCreate.svelte';

	import CategoryCreateSheet from './CategoryCreateSheet.svelte';
	import ProductCreateSheet from './ProductCreateSheet.svelte';

	// renders one independent Sheet.Root per stack entry so nested creates stack naturally
	const stack = getContext<NestedCreateStack | undefined>(NESTED_CREATE_KEY);
</script>

{#if stack}
	{#each stack.stack as req (req.id)}
		<Sheet.Root
			open={true}
			onOpenChange={(o) => {
				if (!o) stack.complete(req.id, null);
			}}
		>
			<Sheet.Content side="right" class="w-full overflow-y-auto sm:max-w-xl">
				{#if req.kind === 'product'}
					<ProductCreateSheet
						prefillName={req.prefillName ?? ''}
						oncreated={(opt) => stack.complete(req.id, opt)}
						oncancel={() => stack.complete(req.id, null)}
					/>
				{:else}
					<CategoryCreateSheet
						prefillName={req.prefillName ?? ''}
						oncreated={(opt) => stack.complete(req.id, opt)}
						oncancel={() => stack.complete(req.id, null)}
					/>
				{/if}
			</Sheet.Content>
		</Sheet.Root>
	{/each}
{/if}
