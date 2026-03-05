<script lang="ts">
	import { AlertCircle, KeyRound, Plus, Save, Shield, Trash2, Users, ChevronRight } from 'lucide-svelte';

	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';

	import { notificationStore } from '../../../stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let selected = $state('');
	let role = $derived(data.roles.find(({ value }) => value === selected));
	let formDataInput: HTMLInputElement;
	let roleIdInput: HTMLInputElement;
	let newPermissionInput = $state('');
	let newRoleName = $state('');
	let isCreatingRole = $state(false);
	let showCreateRole = $state(false);

	let modalState = $state({
		open: false,
		data: {
			text: '',
			index: 0,
		},
	});

	let addItem = () => ({
		permissionId: '',
		permissionName: '',
		roleId: '',
		roleName: '',
	});

	// client-side filtering of grants for the selected role
	let items = $state<typeof data.allGrants>([]);

	$effect(() => {
		if (selected) {
			items = [...data.allGrants.filter((g) => g.roleId === selected)];
		} else {
			items = [];
		}
	});

	function handleSelectRole(roleId: string) {
		selected = roleId;
	}

	function setModalState(open: boolean, data: { text: string; index: number }) {
		modalState = { open, data };
	}

	function handleAddPermission() {
		if (newPermissionInput.trim() === '') return;

		items = [
			...items,
			{
				...addItem(),
				permissionName: newPermissionInput.trim(),
			},
		];
		newPermissionInput = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAddPermission();
		}
	}

	function handleSubmit() {
		formDataInput.value = JSON.stringify(
			items.filter(({ permissionName }) => permissionName.trim() !== '')
		);
		roleIdInput.value = selected;
	}

	function handleDelete(index: number) {
		items = [...items.slice(0, index), ...items.slice(index + 1)];
		modalState.open = false;
	}

	const permissionCount = $derived(items.filter((i) => i.permissionName.trim() !== '').length);
</script>

<svelte:head>
	<title>Permissions - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- header -->
	<div>
		<h1 class="text-2xl font-bold">Permissions</h1>
		<p class="text-sm text-muted-foreground mt-1">Manage permissions assigned to each role</p>
	</div>

	<!-- two-panel layout -->
	<div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
		<!-- left panel: roles -->
		<Card.Root>
			<Card.Header class="pb-3">
				<Card.Title class="flex items-center gap-2 text-base">
					<Users class="h-4 w-4" />
					Roles
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-1 px-3 pb-3">
				{#each data.roles as roleOption}
					<button
						type="button"
						class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
							{selected === String(roleOption.value)
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}"
						onclick={() => handleSelectRole(String(roleOption.value))}
					>
						<span class="flex items-center gap-2">
							<Shield class="h-3.5 w-3.5" />
							{roleOption.name}
						</span>
						{#if selected === String(roleOption.value)}
							<ChevronRight class="h-3.5 w-3.5" />
						{/if}
					</button>
				{/each}

				{#if data.roles.length === 0}
					<p class="text-xs text-muted-foreground text-center py-4">No roles found</p>
				{/if}

				<!-- create role section -->
				{#if data.canCreateRole}
					<div class="border-t pt-3 mt-3">
						{#if showCreateRole}
							<form
								action="?/createRole"
								method="POST"
								use:enhance={() => {
									isCreatingRole = true;
									return async ({ result }) => {
										isCreatingRole = false;
										await applyAction(result);
										if (result.type === 'failure') {
											$notificationStore.error = {
												message: result?.data?.error?.toString() || 'Failed to create role.',
											};
										}
										if (result.type === 'success') {
											$notificationStore.success = {
												message: `Role "${result?.data?.roleName}" created.`,
											};
											newRoleName = '';
											showCreateRole = false;
											await invalidateAll();
										}
									};
								}}
							>
								<div class="flex gap-1.5">
									<Input
										type="text"
										name="roleName"
										placeholder="ROLE_NAME"
										bind:value={newRoleName}
										maxlength={10}
										class="h-8 text-xs"
									/>
									<Button
										type="submit"
										size="sm"
										class="h-8 px-2"
										disabled={!newRoleName.trim() || isCreatingRole}
									>
										<Plus class="h-3.5 w-3.5" />
									</Button>
								</div>
								<p class="text-[10px] text-muted-foreground mt-1.5">
									Uppercase & underscores, max 10 chars
								</p>
							</form>
						{:else}
							<button
								type="button"
								class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
								onclick={() => (showCreateRole = true)}
							>
								<Plus class="h-3.5 w-3.5" />
								Add Role
							</button>
						{/if}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- right panel: permissions -->
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
								{permissionCount} permission{permissionCount !== 1 ? 's' : ''} assigned
							</Card.Description>
						</div>
						<Badge variant="secondary" class="text-sm">
							{permissionCount}
						</Badge>
					</div>
				</Card.Header>
				<Card.Content>
					<form
						action="/settings/user-permissions"
						method="POST"
						onsubmit={handleSubmit}
						use:enhance={() => {
							return async ({ result }) => {
								await applyAction(result);
								if (result.type === 'failure')
									$notificationStore.error = {
										message: result?.data?.error?.toString() || '',
									};
								if (result.type === 'success') {
									$notificationStore.success = { message: 'Permissions updated.' };
									await invalidateAll();
								}
							};
						}}
					>
						<!-- add new permission -->
						<div class="flex gap-2 mb-6">
							<div class="flex-1">
								<Input
									type="text"
									placeholder="Enter new permission name (e.g., view_reports)"
									bind:value={newPermissionInput}
									onkeydown={handleKeyDown}
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

						<!-- permissions list -->
						{#if items.length > 0}
							<div class="space-y-2 mb-6">
								{#each items as grant, index}
									{#if grant.permissionName.trim() !== ''}
										<div
											class="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
										>
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
														<p class="text-xs text-neon-amber-500">New (unsaved)</p>
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
														index,
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
								<div
									class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4"
								>
									<KeyRound class="h-8 w-8 text-muted-foreground/50" />
								</div>
								<h3 class="font-semibold mb-1">No Permissions</h3>
								<p class="text-sm text-muted-foreground">
									This role has no permissions assigned. Add one above.
								</p>
							</div>
						{/if}

						<!-- save button -->
						<div class="flex justify-end pt-4 border-t">
							<input type="hidden" name="formData" bind:this={formDataInput} />
							<input type="hidden" name="roleId" bind:this={roleIdInput} />
							<Button type="submit" class="min-w-[120px]">
								<Save class="h-4 w-4 mr-2" />
								Save Changes
							</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- empty state -->
			<Card.Root class="border-dashed">
				<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
					<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
						<Shield class="h-10 w-10 text-muted-foreground/50" />
					</div>
					<h3 class="text-xl font-semibold mb-2">Select a Role</h3>
					<p class="text-muted-foreground max-w-md">
						Choose a role from the list to view and manage its permissions.
					</p>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</div>

<!-- delete confirmation dialog -->
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
			<Button variant="outline" onclick={() => (modalState.open = false)}>Cancel</Button>
			<Button variant="destructive" onclick={() => handleDelete(modalState.data.index)}>
				<Trash2 class="h-4 w-4 mr-2" />
				Delete
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
