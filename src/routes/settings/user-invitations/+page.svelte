<script lang="ts">
	import {
		AlertCircle,
		Check,
		Clock,
		Copy,
		Mail,
		MailPlus,
		Plus,
		ShieldCheck,
		Trash2,
		UserPlus,
		X,
	} from 'lucide-svelte';
	import moment from 'moment';

	import { enhance } from '$app/forms';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';

	import { notificationStore } from '../../../stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let formModal = $state(false);
	let selectedDate = $state('');
	let inviteOnly = $state(data.inviteOnly);
	let toggleFormRef: HTMLFormElement;

	// Pre-fill modal state for fulfilling requests
	let prefillEmail = $state('');
	let prefillRequestId = $state<number | null>(null);

	async function copyToClipboard(code: string) {
		await navigator.clipboard.writeText(code);
		$notificationStore.success = { message: 'Invite code copied to clipboard.' };
	}

	function openCreateModalForRequest(email: string, requestId: number) {
		prefillEmail = email;
		prefillRequestId = requestId;
		formModal = true;
	}

	function resetPrefill() {
		prefillEmail = '';
		prefillRequestId = null;
		selectedDate = '';
	}

	// Counts
	const inviteCount = $derived(data.invitations?.length || 0);
	const pendingCount = $derived(data.pendingRequests?.length || 0);
</script>

<svelte:head>
	<title>Invitations - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Invitations</h1>
			<p class="text-sm text-muted-foreground mt-1">Manage user invitations and access requests</p>
		</div>
		<Button
			onclick={() => {
				resetPrefill();
				formModal = true;
			}}
		>
			<Plus class="h-4 w-4 mr-2" />
			Create Invite
		</Button>
	</div>

	<!-- Registration Mode Toggle -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title class="flex items-center gap-2">
						<ShieldCheck class="h-5 w-5" />
						Registration Mode
					</Card.Title>
					<Card.Description>
						When invite-only mode is enabled, users must provide a valid invitation code to sign up.
						Disabling this allows anyone to register.
					</Card.Description>
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
					<Switch
						checked={inviteOnly}
						onCheckedChange={(checked) => {
							inviteOnly = checked;
							const input = toggleFormRef.querySelector<HTMLInputElement>('input[name="enabled"]');
							if (input) input.value = String(checked);
							toggleFormRef.requestSubmit();
						}}
					/>
				</form>
			</div>
		</Card.Header>
	</Card.Root>

	<!-- Pending Requests Section -->
	{#if data.pendingRequests && data.pendingRequests.length > 0}
		<Card.Root class="border-amber-500/30">
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="flex items-center gap-2">
							<AlertCircle class="h-5 w-5 text-amber-500" />
							Pending Requests
						</Card.Title>
						<Card.Description>Users requesting access to the system</Card.Description>
					</div>
					<Badge variant="secondary" class="text-sm bg-amber-500/10 text-amber-600">
						{pendingCount}
					</Badge>
				</div>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-3">
					{#each data.pendingRequests as request}
						<div
							class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-amber-500/5"
						>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<Mail class="h-4 w-4 text-muted-foreground shrink-0" />
									<span class="font-medium truncate">{request.email}</span>
								</div>
								{#if request.message}
									<p class="text-sm text-muted-foreground line-clamp-2 ml-6">
										"{request.message}"
									</p>
								{/if}
								<div class="flex items-center gap-1 text-xs text-muted-foreground mt-1 ml-6">
									<Clock class="h-3 w-3" />
									Requested {moment(request.createdAt).fromNow()}
								</div>
							</div>
							<div class="flex items-center gap-2 shrink-0">
								<Button
									size="sm"
									onclick={() =>
										openCreateModalForRequest(request.email, request.invitationRequestId)}
								>
									<Check class="h-4 w-4 mr-1" />
									Create Invite
								</Button>
								<form
									method="POST"
									action="?/rejectRequest"
									class="inline-block"
									use:enhance={() => {
										return async ({ result, update }) => {
											if (result.type === 'success') {
												$notificationStore.success = { message: 'Request rejected.' };
											} else if (result.type === 'failure') {
												$notificationStore.error = {
													message: String(result.data?.error || 'Failed to reject request'),
												};
											}
											await update();
										};
									}}
								>
									<input type="hidden" name="requestId" value={request.invitationRequestId} />
									<Button
										variant="outline"
										size="sm"
										type="submit"
										class="text-destructive hover:bg-destructive hover:text-destructive-foreground"
									>
										<X class="h-4 w-4 mr-1" />
										Reject
									</Button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Invitations Card -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title class="flex items-center gap-2">
						<MailPlus class="h-5 w-5" />
						Active Invitations
					</Card.Title>
					<Card.Description>
						{inviteCount} invitation{inviteCount !== 1 ? 's' : ''} in the system
					</Card.Description>
				</div>
				<Badge variant="secondary" class="text-sm">
					{inviteCount}
				</Badge>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="pl-6">Invite Code</Table.Head>
							<Table.Head>Email</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="hidden sm:table-cell">Issued At</Table.Head>
							<Table.Head class="hidden md:table-cell">Expires At</Table.Head>
							<Table.Head class="text-right pr-6">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.invitations as invite}
							<Table.Row class="group">
								<Table.Cell class="pl-6">
									<button
										type="button"
										class="inline-flex items-center gap-2 font-mono cursor-pointer hover:text-primary transition-colors"
										onclick={() => copyToClipboard(invite.invitationCode)}
										title="Click to copy"
									>
										{invite.invitationCode}
										<Copy class="w-3 h-3 opacity-50" />
									</button>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2 text-muted-foreground">
										<Mail class="h-4 w-4 shrink-0" />
										<span class="truncate">{invite.email || 'Any'}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if invite.userId}
										<Badge variant="secondary">Used</Badge>
									{:else}
										<Badge
											variant="outline"
											class="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"
											>Available</Badge
										>
									{/if}
								</Table.Cell>
								<Table.Cell class="hidden sm:table-cell text-muted-foreground">
									{invite.issuedAt ? moment(invite.issuedAt).format('MMM D, YYYY') : 'N/A'}
								</Table.Cell>
								<Table.Cell class="hidden md:table-cell text-muted-foreground">
									{invite.expiresAt ? moment(invite.expiresAt).format('MMM D, YYYY') : 'Never'}
								</Table.Cell>
								<Table.Cell class="text-right pr-6">
									<form
										method="POST"
										action="?/delete"
										class="inline-block"
										use:enhance={() => {
											return async ({ result, update }) => {
												if (result.type === 'success') {
													$notificationStore.success = { message: 'Invitation deleted.' };
												} else if (result.type === 'failure') {
													$notificationStore.error = {
														message: String(result.data?.error || 'Failed to delete invitation'),
													};
												}
												await update();
											};
										}}
									>
										<input type="hidden" name="invitationId" value={invite.invitationId} />
										<Button
											variant="outline"
											size="icon"
											type="submit"
											class="h-8 w-8 bg-destructive/20 border-destructive/50 text-red-400 hover:bg-destructive hover:text-destructive-foreground"
											title="Delete invitation"
										>
											<Trash2 class="w-4 h-4" />
										</Button>
									</form>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			{#if data.invitations.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center px-6">
					<div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
						<MailPlus class="h-8 w-8 text-muted-foreground/50" />
					</div>
					<h3 class="font-semibold mb-1">No Invitations</h3>
					<p class="text-sm text-muted-foreground mb-4">
						Create an invitation to invite users to Busser.
					</p>
					<Button
						onclick={() => {
							resetPrefill();
							formModal = true;
						}}
					>
						<Plus class="h-4 w-4 mr-2" />
						Create First Invite
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<Dialog.Root
	bind:open={formModal}
	onOpenChange={(open) => {
		if (!open) resetPrefill();
	}}
>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>
				{#if prefillRequestId}
					Fulfill Invitation Request
				{:else}
					Create Invite
				{/if}
			</Dialog.Title>
			{#if prefillRequestId}
				<Dialog.Description>
					Creating an invitation for a user who requested access.
				</Dialog.Description>
			{/if}
		</Dialog.Header>
		<form
			class="flex flex-col space-y-6"
			method="POST"
			action="?/create"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						formModal = false;
						resetPrefill();
						$notificationStore.success = {
							message: prefillRequestId
								? 'Invitation created and request fulfilled.'
								: 'Invitation created.',
						};
					} else if (result.type === 'failure') {
						$notificationStore.error = {
							message: String(result.data?.error || 'Failed to create invitation'),
						};
					}
					await update();
				};
			}}
		>
			{#if prefillRequestId}
				<input type="hidden" name="requestId" value={prefillRequestId} />
			{/if}
			<div class="grid grid-cols-3 gap-4">
				<div class="space-y-2">
					<Label for="code">Code</Label>
					<Input type="text" name="code" id="code" maxlength={6} class="font-mono uppercase" />
					<p class="text-xs text-muted-foreground">Leave blank to auto-generate a unique code.</p>
				</div>
				<div class="space-y-2 col-span-2">
					<Label for="expiration">Expiration</Label>
					<DatePicker
						name="expiration"
						id="expiration"
						bind:value={selectedDate}
						placeholder="No expiration"
					/>
					<p class="text-xs text-muted-foreground">Optionally set an invitation expiry date.</p>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="email">Email <span class="text-destructive">*</span></Label>
				<Input
					type="email"
					name="email"
					id="email"
					value={prefillEmail}
					required
					readonly={!!prefillRequestId}
					class={prefillRequestId ? 'bg-muted' : ''}
				/>
				<p class="text-xs text-muted-foreground">
					{#if prefillRequestId}
						Email from the invitation request.
					{:else}
						The email address of the user being invited.
					{/if}
				</p>
			</div>
			<Dialog.Footer>
				<Button type="submit" size="lg" class="w-full">
					{#if prefillRequestId}
						<UserPlus class="h-4 w-4 mr-2" />
						Create Invite & Fulfill Request
					{:else}
						Create Invite
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
