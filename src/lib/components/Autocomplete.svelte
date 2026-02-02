<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { SelectOption } from '$lib/types';
	import { cn } from '$lib/utils';

	export let label: string;
	export let value: string | null;
	export let fetchUrl: string;
	export let placeholder = '';
	export let name = '';
	export let key: string | undefined;
	export let required = false;
	export let actionUrl = '';
	export let grant = '';
	export let onselect: ((item: SelectOption) => void) | undefined = undefined;
	const permissions: string[] = getContext('permissions');

	let items: any[] = [];

	onMount(async () => {
		let response = await fetch(fetchUrl, {
			method: 'GET',
		});
		const selectOptions = await response.json();
		items = selectOptions;
	});

	let show = false;
	$: selectValue = key || '';
	$: search = items.filter(
		({ name }) => name.toLowerCase().indexOf(selectValue.toLowerCase()) !== -1
	);
	$: value =
		search.find(({ name }) => {
			return name.toLowerCase().trim() === selectValue.toLocaleLowerCase().trim();
		})?.value ||
		value ||
		null;
	$: disabled = items.length === 0;

	const showAutocomplete = () => (show = true);
	const hideAutocomplete = () =>
		setTimeout(() => {
			if (!search.length) {
				selectValue = '';
			}
			show = false;
		}, 100);

	const handleClick = (item: SelectOption) => {
		selectValue = item.name;
		show = false;
		onselect?.(item);
	};
</script>

<div class="w-full">
	<slot></slot>
	{#if name}
		<Label for={name} class="mb-2">{label}</Label>
		<input id={name} {name} class="hidden" bind:value />
	{:else}
		<Label for="autoselect" class="mb-2">{label}</Label>
		<input id="autoselect" class="hidden" bind:value />
	{/if}
	<div class="flex">
		<Input
			type="text"
			{placeholder}
			onfocus={showAutocomplete}
			onblur={hideAutocomplete}
			bind:value={selectValue}
			{required}
			{disabled}
			class={actionUrl && (!grant || (grant && permissions.includes(grant)))
				? 'rounded-r-none'
				: ''}
		/>
		{#if actionUrl && (!grant || (grant && permissions.includes(grant)))}
			<a class={cn(buttonVariants(), 'rounded-l-none')} href="/inventory/category/add">
				<Plus class="h-4 w-4" />
			</a>
		{/if}
	</div>
	{#if show}
		<div class="relative">
			<div
				class="absolute w-full max-h-44 overflow-y-auto z-20 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md"
			>
				{#each search as item}
					<button
						type="button"
						class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
						onmousedown={() => handleClick(item)}
					>
						{item.name}
					</button>
				{/each}
				{#if !search.length}
					<div class="px-3 py-2 text-sm text-muted-foreground">No Results</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
