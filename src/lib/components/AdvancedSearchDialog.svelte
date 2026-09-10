<script lang="ts">
	import AdvancedSearchFields from '$lib/components/AdvancedSearchFields.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { PreparationMethod } from '$lib/types';

	let {
		open = $bindable(false),
		preparationMethods = [],
		filters = {},
		onsearch,
	}: {
		open?: boolean;
		preparationMethods?: PreparationMethod[];
		filters?: Record<string, any>;
		onsearch?: (params: Record<string, string>) => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar">
		<Dialog.Header>
			<Dialog.Title>Advanced Search</Dialog.Title>
			<Dialog.Description>Narrow down recipes with detailed filters</Dialog.Description>
		</Dialog.Header>

		<AdvancedSearchFields
			active={open}
			{preparationMethods}
			{filters}
			onsearch={(params) => {
				onsearch?.(params);
				open = false;
			}}
			oncancel={() => (open = false)}
		/>
	</Dialog.Content>
</Dialog.Root>
