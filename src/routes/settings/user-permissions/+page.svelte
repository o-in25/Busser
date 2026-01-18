<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { AlertCircle, Trash2 } from 'lucide-svelte';
	import { page } from '$app/state';
	import { applyAction, enhance } from '$app/forms';
	import { notificationStore } from '../../../stores';

	let { data }: { data: PageData } = $props();
	let selected = $state(page.url.searchParams.get('role') || '');
	let role = $derived(data.roles.find(({ value }) => value === selected));
	let formDataInput: HTMLInputElement;

	let modalState = $state({
		open: false,
		data: {
			text: '',
			index: 0
		}
	});

	let addItem = () => ({
		permissionId: '',
		permissionName: '',
		roleId: '',
		roleName: ''
	});

	const initialItems = structuredClone(data.grants);
	let items = $derived([...data.grants, addItem()]);

	function handleSelectChange(value: string) {
		selected = value;
		const params = new URLSearchParams({ role: value });
		goto(`/settings/user-permissions?${params}`);
	}

	function setModalState(open: boolean, data: { text: string; index: number }) {
		modalState = { open, data };
	}

	function handleInputChange(grant: any, index: number) {
		const last = items.length - 1;
		const isLast = index === last;
		const isEmpty = grant.permissionName.trim() === '';

		if (isLast && !isEmpty) {
			items = [...items, addItem()];
		}

		if (!isLast && index === last - 1 && isEmpty) {
			const lastItem = items[items.length - 1];
			if (lastItem.permissionName.trim() === '') {
				items = items.slice(0, -1);
			}
		}
	}

	function handleSubmit() {
		formDataInput.value = JSON.stringify(items.filter(({ permissionName }) => permissionName.trim() !== ''));
	}

	function handleDelete(index: number) {
		items = [...items.slice(0, index), ...items.slice(index + 1)];
		modalState.open = false;
	}
</script>

<svelte:head>
	<title>Grants & Roles - Busser</title>
</svelte:head>
<div class="flex items-center justify-between gap-4">
	<div class="text-sm text-muted-foreground">
		<h4 class="text-xl font-extrabold mb-4 flex flex-row justify-between">
			Grants & Roles
		</h4>
	</div>
</div>

<form>
	<div class="mb-4">
		<Label for="role-select">
			Select a Role
		</Label>
		<Select.Root
			type="single"
			value={selected}
			onValueChange={handleSelectChange}
		>
			<Select.Trigger class="mt-2" id="role-select">
				<Select.Value placeholder="Select a role...">
					{#if role}
						{role.name}
					{:else}
						<span class="text-muted-foreground">Select a role...</span>
					{/if}
				</Select.Value>
			</Select.Trigger>
			<Select.Content>
				{#each data.roles as roleOption}
					<Select.Item value={String(roleOption.value)} label={roleOption.name} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
</form>

{#if selected}
	<form
		action="/settings/user-permissions?role={role?.value}"
		method="POST"
		onsubmit={handleSubmit}
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect') {
					goto(result.location);
				} else {
					await applyAction(result);
					if (result.type === 'failure')
						$notificationStore.error = {
							message: result?.data?.error?.toString() || '',
						};
					if (result.type === 'success')
						$notificationStore.success = { message: 'Permissions updated.' };
				}
			};
		}}
	>
		<div class="grid gap-6 mb-6 md:grid-cols-2">
			{#each items as grant, index}
				<div class="flex">
					<Input
						type="text"
						id={grant.permissionId}
						bind:value={grant.permissionName}
						oninput={() => handleInputChange(grant, index)}
					/>
					{#if grant.permissionId}
						<Button
							type="button"
							class="!px-4 ms-2 flex items-center"
							onclick={() =>
								setModalState(true, {
									text: grant.permissionName,
									index
								})}
						>
							<Trash2 class="w-3 h-3 mx-auto" />
						</Button>
					{/if}
				</div>
			{/each}
		</div>
		<div class="my-4 md:mr-4 order-2 flex justify-end">
			<input type="hidden" class="hidden" name="formData" id="formData" bind:this={formDataInput} />
			<Button class="w-full md:w-32" type="submit" size="lg">
				Save
			</Button>
		</div>
	</form>
{/if}

<Dialog.Root bind:open={modalState.open}>
	<Dialog.Content class="sm:max-w-xs">
		<div class="text-center">
			<AlertCircle class="mx-auto mb-4 text-muted-foreground w-12 h-12" />
			<h3 class="mb-5 text-lg font-normal text-muted-foreground">
				Are you sure you want to delete {modalState.data.text}?
			</h3>
			<div class="flex justify-center gap-2">
				<Button variant="destructive" onclick={() => handleDelete(modalState.data.index)}>
					Yes, I'm sure
				</Button>
				<Button variant="outline" onclick={() => (modalState.open = false)}>
					No, cancel
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
