<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import type { PageData, ActionData } from './$types';
	import { Plus, Trash2, Copy, Mail, Clock, Check, X, UserPlus } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { notificationStore } from '../../../stores';
	import moment from 'moment';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let formModal = $state(false);
	let selectedDate = $state('');
	let deleteConfirmId = $state<number | null>(null);

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
</script>

<!-- Pending Requests Section -->
{#if data.pendingRequests && data.pendingRequests.length > 0}
	<div class="mb-8">
		<div class="flex items-center gap-2 mb-4">
			<h3 class="text-lg font-semibold">Pending Requests</h3>
			<Badge variant="secondary">{data.pendingRequests.length}</Badge>
		</div>

		<div class="grid gap-3">
			{#each data.pendingRequests as request}
				<Card.Root class="border-amber-500/30 bg-amber-500/5">
					<Card.Content class="p-4">
						<div class="flex flex-col sm:flex-row sm:items-center gap-4">
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
									onclick={() => openCreateModalForRequest(request.email, request.invitationRequestId)}
								>
									<Check class="h-4 w-4 mr-1" />
									Create Invite
								</Button>
								<form method="POST" action="?/rejectRequest" class="inline-block" use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === 'success') {
											$notificationStore.success = { message: 'Request rejected.' };
										} else if (result.type === 'failure') {
											$notificationStore.error = { message: String(result.data?.error || 'Failed to reject request') };
										}
										await update();
									};
								}}>
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
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
{/if}

<!-- Invitations Table -->
<div class="flex items-center justify-between mb-4">
	<h3 class="text-lg font-semibold">Invitations</h3>
	<Button
		variant="outline"
		size="sm"
		onclick={() => { resetPrefill(); formModal = true; }}
	>
		<Plus class="w-4 h-4 mr-1" />
		Create Invite
	</Button>
</div>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Invite Code</Table.Head>
			<Table.Head>Email</Table.Head>
			<Table.Head>Status</Table.Head>
			<Table.Head>Issued At</Table.Head>
			<Table.Head>Expires At</Table.Head>
			<Table.Head class="text-right">Actions</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each data.invitations as invite}
			<Table.Row>
				<Table.Cell>
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
				<Table.Cell>{invite.email || 'Any'}</Table.Cell>
				<Table.Cell>
					{#if invite.userId}
						<Badge variant="secondary">Used</Badge>
					{:else}
						<Badge variant="outline" class="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">Available</Badge>
					{/if}
				</Table.Cell>
				<Table.Cell>{invite.issuedAt ? moment(invite.issuedAt).format('YYYY-MM-DD') : 'N/A'}</Table.Cell>
				<Table.Cell>{invite.expiresAt ? moment(invite.expiresAt).format('YYYY-MM-DD') : 'Never'}</Table.Cell>
				<Table.Cell class="text-right">
					<form method="POST" action="?/delete" class="inline-block" use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								$notificationStore.success = { message: 'Invitation deleted.' };
							} else if (result.type === 'failure') {
								$notificationStore.error = { message: String(result.data?.error || 'Failed to delete invitation') };
							}
							await update();
						};
					}}>
						<input type="hidden" name="invitationId" value={invite.invitationId} />
						<Button
							variant="outline"
							size="icon"
							type="submit"
							class="h-8 w-8 bg-destructive/20 border-destructive/50 text-red-400 hover:bg-destructive hover:text-destructive-foreground"
						>
							<Trash2 class="w-4 h-4" />
						</Button>
					</form>
				</Table.Cell>
			</Table.Row>
		{/each}
		{#if data.invitations.length === 0}
			<Table.Row>
				<Table.Cell colspan={6} class="text-center py-8 text-muted-foreground">
					No invitations yet. Create one to invite users to Busser.
				</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>

<Dialog.Root bind:open={formModal} onOpenChange={(open) => { if (!open) resetPrefill(); }}>
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
						$notificationStore.success = { message: prefillRequestId ? 'Invitation created and request fulfilled.' : 'Invitation created.' };
					} else if (result.type === 'failure') {
						$notificationStore.error = { message: String(result.data?.error || 'Failed to create invitation') };
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
					<Input
						type="text"
						name="code"
						id="code"
						maxlength={6}
						class="font-mono uppercase"
					/>
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
