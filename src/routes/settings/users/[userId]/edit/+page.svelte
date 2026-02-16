<script lang="ts">
	import { getContext } from 'svelte';
	import { ArrowLeft, KeyRound, Save, User } from 'lucide-svelte';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import { cn } from '$lib/utils';

	import { notificationStore } from '../../../../../stores';
	import type { ActionData, PageData } from './$types';

	export let form: ActionData;
	export let data: PageData;
	const permissions: string[] = getContext('permissions') || [];
	const isAdmin = permissions.includes('edit_admin');

	let selected = data.user?.roles.map(({ roleId }) => roleId) || [];

	function toggleRole(roleId: string) {
		if (selected.includes(roleId)) {
			selected = selected.filter((id) => id !== roleId);
		} else {
			selected = [...selected, roleId];
		}
	}
</script>

<svelte:head>
	<title>Edit User - Busser</title>
</svelte:head>

{#if isAdmin}
	<Breadcrumb name="Users" href="/settings/users">
		<BreadcrumbItem name="Edit User"></BreadcrumbItem>
	</Breadcrumb>
{/if}

<div class="space-y-6 mt-3">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Edit User</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Update account details for {data.user?.username || 'this user'}
			</p>
		</div>
		<a
			class={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
			href="/settings/users/{data.user?.userId}"
		>
			<ArrowLeft class="h-4 w-4 mr-2" />
			Back
		</a>
	</div>

	<form
		class="space-y-6"
		method="POST"
		action={`/settings/users/${data.user?.userId}/edit`}
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
						$notificationStore.success = { message: 'User updated.' };
				}
			};
		}}
	>
		<!-- User Info Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<User class="h-5 w-5" />
					User Information
				</Card.Title>
				<Card.Description>Basic account details</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="username">Username</Label>
					<Input type="text" id="username" name="username" value={data.user?.username || ''} />
				</div>
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input type="email" id="email" name="email" value={data.user?.email || ''} />
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Roles Card (admin only) -->
		{#if isAdmin && data.roles?.length && data.user?.userId !== data.currentUser}
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<KeyRound class="h-5 w-5" />
						Roles
					</Card.Title>
					<Card.Description>Assign system roles to this user</Card.Description>
				</Card.Header>
				<Card.Content>
					<input class="hidden" name="roles" id="roles" bind:value={selected} />
					<div class="flex flex-wrap gap-2">
						{#each data.roles as role}
							<button
								type="button"
								onclick={() => toggleRole(String(role.value))}
								class="px-3 py-1.5 text-sm rounded-full border transition-colors
									{selected.includes(String(role.value))
									? 'bg-primary text-primary-foreground border-primary'
									: 'bg-background border-input hover:bg-accent'}"
							>
								{role.name}
							</button>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Actions Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Actions</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<a
						href="/settings/users/{data.user?.userId}/reset-password"
						class="text-sm text-primary hover:underline"
					>
						Reset Password...
					</a>
					<Button type="submit" class="w-full sm:w-auto">
						<Save class="h-4 w-4 mr-2" />
						Save Changes
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</form>
</div>
