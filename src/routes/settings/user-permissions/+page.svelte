<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import {
		AlertCircle,
		Trash2,
		Shield,
		Plus,
		Save,
		KeyRound,
		Users,
		X,
	} from 'lucide-svelte';
	import { page } from '$app/state';
	import { applyAction, enhance } from '$app/forms';
	import { notificationStore } from '../../../stores';

	let { data }: { data: PageData } = $props();
	let selected = $state(page.url.searchParams.get('role') || '');
	let role = $derived(data.roles.find(({ value }) => value === selected));
	let formDataInput: HTMLInputElement;
	let newPermissionInput = $state('');

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

	let items = $state([...data.grants]);

	// Update items when data.grants changes (e.g., when role changes)
	$effect(() => {
		items = [...data.grants];
	});

	function handleSelectChange(value: string) {
		selected = value;
		const params = new URLSearchParams({ role: value });
		goto(`/settings/user-permissions?${params}`);
	}

	function setModalState(open: boolean, data: { text: string; index: number }) {
		modalState = { open, data };
	}

	function handleAddPermission() {
		if (newPermissionInput.trim() === '') return;

		items = [...items, {
			...addItem(),
			permissionName: newPermissionInput.trim()
		}];
		newPermissionInput = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAddPermission();
		}
	}

	function handleSubmit() {
		formDataInput.value = JSON.stringify(items.filter(({ permissionName }) => permissionName.trim() !== ''));
	}

	function handleDelete(index: number) {
		items = [...items.slice(0, index), ...items.slice(index + 1)];
		modalState.open = false;
	}

	// Count of permissions
	const permissionCount = $derived(items.filter(i => i.permissionName.trim() !== '').length);
</script>

<svelte:head>
	<title>Grants & Roles - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold">Grants & Roles</h1>
		<p class="text-sm text-muted-foreground mt-1">
			Manage permissions assigned to each role
		</p>
	</div>

	<!-- Role Selection Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Users class="h-5 w-5" />
				Select Role
			</Card.Title>
			<Card.Description>
				Choose a role to view and manage its permissions
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Select.Root
				type="single"
				value={selected}
				onValueChange={handleSelectChange}
			>
				<Select.Trigger class="w-full sm:w-[300px]" id="role-select">
					<Shield class="h-4 w-4 mr-2" />
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
		</Card.Content>
	</Card.Root>

	<!-- Permissions Card -->
	{#if selected && role}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="flex items-center gap-2">
							<KeyRound class="h-5 w-5" />
							Permissions for {role.name}
						</Card.Title>
						<Card.Description>
							{permissionCount} permission{permissionCount !== 1 ? 's' : ''} assigned to this role
						</Card.Description>
					</div>
					<Badge variant="secondary" class="text-sm">
						{permissionCount}
					</Badge>
				</div>
			</Card.Header>
			<Card.Content>
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
					<!-- Add New Permission -->
					<div class="flex gap-2 mb-6">
						<div class="flex-1 relative">
							<Input
								type="text"
								placeholder="Enter new permission name (e.g., view_reports)"
								bind:value={newPermissionInput}
								onkeydown={handleKeyDown}
								class="pr-10"
							/>
						</div>
						<Button
							type="button"
							variant="default"
							onclick={handleAddPermission}
							disabled={newPermissionInput.trim() === ''}
						>
							<Plus class="h-4 w-4 mr-2" />
							Add
						</Button>
					</div>

					<!-- Permissions List -->
					{#if items.length > 0}
						<div class="space-y-2 mb-6">
							{#each items as grant, index}
								{#if grant.permissionName.trim() !== ''}
									<div class="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
										<div class="flex items-center gap-3">
											<div class="p-2 rounded-lg bg-primary/10">
												<KeyRound class="h-4 w-4 text-primary" />
											</div>
											<div>
												<p class="font-medium font-mono text-sm">
													{grant.permissionName}
												</p>
												{#if grant.permissionId}
													<p class="text-xs text-muted-foreground">
														ID: {grant.permissionId}
													</p>
												{:else}
													<p class="text-xs text-amber-500">
														New (unsaved)
													</p>
												{/if}
											</div>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											class="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
											onclick={() =>
												setModalState(true, {
													text: grant.permissionName,
													index
												})}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 mb-6">
							<div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
								<KeyRound class="h-8 w-8 text-muted-foreground/50" />
							</div>
							<h3 class="font-semibold mb-1">No Permissions</h3>
							<p class="text-sm text-muted-foreground">
								This role has no permissions assigned. Add one above.
							</p>
						</div>
					{/if}

					<!-- Save Button -->
					<div class="flex justify-end pt-4 border-t">
						<input type="hidden" class="hidden" name="formData" id="formData" bind:this={formDataInput} />
						<Button type="submit" class="min-w-[120px]">
							<Save class="h-4 w-4 mr-2" />
							Save Changes
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Empty State -->
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
				<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
					<Shield class="h-10 w-10 text-muted-foreground/50" />
				</div>
				<h3 class="text-xl font-semibold mb-2">Select a Role</h3>
				<p class="text-muted-foreground mb-6 max-w-md">
					Choose a role from the dropdown above to view and manage its permissions.
				</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={modalState.open}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<AlertCircle class="h-5 w-5 text-destructive" />
				Delete Permission
			</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to remove this permission from the role?
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			<div class="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
				<KeyRound class="h-5 w-5 text-muted-foreground" />
				<code class="font-mono text-sm font-medium">{modalState.data.text}</code>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (modalState.open = false)}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={() => handleDelete(modalState.data.index)}>
				<Trash2 class="h-4 w-4 mr-2" />
				Delete
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
