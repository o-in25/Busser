<script lang="ts">
	import { Dices, Info, Mail, MailX, Palette, Save, ShieldCheck, Upload, User, X } from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import ThemeMixer from '$lib/components/ThemeMixer.svelte';
	import { generateRandomAvatarDataUri } from '$lib/utils/avatar';
	import { notificationStore } from '../../stores';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const permissions: string[] = getContext('permissions') || [];
	let inviteOnly = $state(data.inviteOnly);
	let toggleFormRef: HTMLFormElement;

	let currentAvatarUrl = $state(data.avatarImageUrl || '');
	let pendingAvatarDataUri = $state<string | null>(null);
	let pendingAvatarFile = $state<File | null>(null);
	let fileInput: HTMLInputElement;
	let isSaving = $state(false);

	// update current avatar when form succeeds
	$effect(() => {
		if (form?.success && form?.avatarImageUrl) {
			currentAvatarUrl = form.avatarImageUrl;
			pendingAvatarDataUri = null;
			pendingAvatarFile = null;
		}
	});

	// also sync with data changes
	$effect(() => {
		if (data.avatarImageUrl && !pendingAvatarDataUri) {
			currentAvatarUrl = data.avatarImageUrl;
		}
	});

	function generateRandom() {
		pendingAvatarDataUri = generateRandomAvatarDataUri();
		pendingAvatarFile = null;
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		pendingAvatarFile = file;
		const reader = new FileReader();
		reader.onload = (e) => {
			pendingAvatarDataUri = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function cancelPending() {
		pendingAvatarDataUri = null;
		pendingAvatarFile = null;
		if (fileInput) fileInput.value = '';
	}

	// display url: pending preview or current saved avatar
	let displayUrl = $derived(pendingAvatarDataUri || currentAvatarUrl);
	let hasPendingChange = $derived(!!pendingAvatarDataUri);
</script>

<svelte:head>
	<title>Settings - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold">General Settings</h1>
		<p class="text-sm text-muted-foreground mt-1">Configure your application preferences</p>
	</div>

	<!-- Avatar Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<User class="h-5 w-5" />
				Avatar
			</Card.Title>
			<Card.Description>Customize your profile picture</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
				<!-- Avatar Preview -->
				<div class="relative shrink-0">
					<div
						class="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center {hasPendingChange
							? 'ring-2 ring-primary ring-offset-2'
							: ''}"
					>
						{#if displayUrl}
							<img src={displayUrl} alt="Avatar" class="w-full h-full object-cover" />
						{:else}
							<User class="w-12 h-12 text-muted-foreground" />
						{/if}
					</div>
					{#if hasPendingChange}
						<span
							class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full"
						>
							Preview
						</span>
					{/if}
				</div>

				<!-- Avatar Actions -->
				<div class="flex flex-col gap-3 w-full sm:w-auto">
					{#if hasPendingChange}
						<p class="text-sm text-muted-foreground">
							Preview your new avatar. Click Save to apply or Cancel to discard.
						</p>
					{:else}
						<p class="text-sm text-muted-foreground">
							Upload your own image or generate a random avatar
						</p>
					{/if}

					<div class="grid grid-cols-2 sm:flex gap-2">
						{#if hasPendingChange}
							<!-- Save/Cancel buttons when there's a pending change -->
							<form
								method="POST"
								action="?/saveAvatar"
								enctype="multipart/form-data"
								use:enhance={() => {
									isSaving = true;
									return async ({ update }) => {
										await update();
										await invalidateAll();
										isSaving = false;
									};
								}}
							>
								<input type="hidden" name="avatarDataUri" value={pendingAvatarDataUri || ''} />
								{#if pendingAvatarFile}
									<input
										type="file"
										name="avatarFile"
										class="hidden"
										bind:this={fileInput}
										onchange={handleFileSelect}
									/>
								{/if}
								<Button type="submit" size="sm" disabled={isSaving}>
									<Save class="h-4 w-4 mr-2" />
									{isSaving ? 'Saving...' : 'Save'}
								</Button>
							</form>
							<Button type="button" variant="outline" size="sm" onclick={cancelPending}>
								<X class="h-4 w-4 mr-2" />
								Cancel
							</Button>
						{:else}
							<!-- Generate/Upload buttons when no pending change -->
							<Button type="button" variant="outline" size="sm" class="whitespace-nowrap" onclick={generateRandom}>
								<Dices class="h-4 w-4 mr-2 shrink-0" />
								Generate Random
							</Button>

							<input
								bind:this={fileInput}
								type="file"
								name="avatar"
								accept="image/*"
								class="hidden"
								onchange={handleFileSelect}
							/>
							<Button type="button" variant="outline" size="sm" class="whitespace-nowrap" onclick={() => fileInput.click()}>
								<Upload class="h-4 w-4 mr-2 shrink-0" />
								Upload Image
							</Button>
						{/if}
					</div>

					{#if form?.error}
						<p class="text-sm text-destructive">{form.error}</p>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Appearance Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Palette class="h-5 w-5" />
				Appearance
			</Card.Title>
			<Card.Description>Customize how Busser looks on your device</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center justify-between p-4 rounded-lg bg-muted/30">
				<div class="space-y-1">
					<p class="font-medium">Theme</p>
					<p class="text-sm text-muted-foreground">Switch between light and dark mode</p>
				</div>
				<ThemeMixer />
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Registration Mode Toggle (admin only) -->
	{#if permissions.includes('edit_admin')}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<ShieldCheck class="h-5 w-5" />
					Registration Mode
				</Card.Title>
				<Card.Description>Control how new users can sign up</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30">
					<div class="space-y-1">
						<p class="font-medium">Invite-Only Mode</p>
						<p class="text-sm text-muted-foreground">
							{inviteOnly ? 'Users must have a valid invitation code to register' : 'Anyone can register without an invitation'}
						</p>
					</div>
					<form
						bind:this={toggleFormRef}
						method="POST"
						action="?/toggleInviteOnly"
						use:enhance={() => {
							return async ({ result, update }) => {
								if (result.type === 'success') {
									$notificationStore.success = {
										message: inviteOnly ? 'Invite-only mode enabled.' : 'Open registration enabled.',
									};
								} else if (result.type === 'failure') {
									inviteOnly = !inviteOnly;
									$notificationStore.error = {
										message: 'Failed to update registration mode.',
									};
								}
								await update();
							};
						}}
					>
						<input type="hidden" name="enabled" value={inviteOnly} />
						<div class="flex items-center gap-3">
							<MailX class="h-4 w-4 text-red-500" />
							<Switch
								checked={inviteOnly}
								onCheckedChange={(checked) => {
									inviteOnly = checked;
									const input = toggleFormRef.querySelector<HTMLInputElement>('input[name="enabled"]');
									if (input) input.value = String(checked);
									toggleFormRef.requestSubmit();
								}}
							/>
							<Mail class="h-4 w-4 text-green-500" />
						</div>
					</form>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- App Info Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Info class="h-5 w-5" />
				About
			</Card.Title>
			<Card.Description>Application information</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="p-4 rounded-lg bg-muted/30">
					<p class="text-sm text-muted-foreground mb-1">Application</p>
					<p class="font-semibold">Busser</p>
				</div>
				<div class="p-4 rounded-lg bg-muted/30">
					<p class="text-sm text-muted-foreground mb-1">Version</p>
					<p class="font-semibold">{data.appVersion}</p>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
