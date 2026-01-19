<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import type { PageData, ActionData } from './$types';
	import { Plus, Trash2, Copy } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { notificationStore } from '../../../stores';
	import moment from 'moment';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let formModal = $state(false);
	let selectedDate = $state('');
	let deleteConfirmId = $state<number | null>(null);

	async function copyToClipboard(code: string) {
		await navigator.clipboard.writeText(code);
		$notificationStore.success = { message: 'Invite code copied to clipboard.' };
	}
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Invite Code</Table.Head>
			<Table.Head>Email</Table.Head>
			<Table.Head>Used By</Table.Head>
			<Table.Head>Issued At</Table.Head>
			<Table.Head>Expires At</Table.Head>
			<Table.Head class="text-right">
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					onclick={() => (formModal = true)}
				>
					<Plus class="w-4 h-4" />
				</Button>
			</Table.Head>
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
				<Table.Cell>{invite.userId ? 'Used' : 'Available'}</Table.Cell>
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
	</Table.Body>
</Table.Root>

<Dialog.Root bind:open={formModal}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Create Invite</Dialog.Title>
		</Dialog.Header>
		<form
			class="flex flex-col space-y-6"
			method="POST"
			action="?/create"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						formModal = false;
						selectedDate = '';
						$notificationStore.success = { message: 'Invitation created.' };
					} else if (result.type === 'failure') {
						$notificationStore.error = { message: String(result.data?.error || 'Failed to create invitation') };
					}
					await update();
				};
			}}
		>
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
					required
				/>
				<p class="text-xs text-muted-foreground">The email address of the user being invited.</p>
			</div>
			<Dialog.Footer>
				<Button type="submit" size="lg" class="w-full">
					Create Invite
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
