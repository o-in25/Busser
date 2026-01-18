<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import type { PageData } from './$types';
	import { Plus, Trash2 } from 'lucide-svelte';
	import moment from 'moment';

	let { data }: { data: PageData } = $props();
	let formModal = $state(false);
	let selectedDate = $state('');
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Invite Code</Table.Head>
			<Table.Head>Used By</Table.Head>
			<Table.Head>Issued At</Table.Head>
			<Table.Head>Expires At</Table.Head>
			<Table.Head>Last Sent At</Table.Head>
			<Table.Head>
				<div class="inline-flex rounded-lg shadow-sm float-right">
					<Button
						variant="outline"
						size="sm"
						onclick={() => (formModal = true)}
					>
						<Plus class="w-4 h-4" />
					</Button>
				</div>
			</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each data.invitations as invite}
			<Table.Row>
				<Table.Cell>{invite.invitationCode}</Table.Cell>
				<Table.Cell>{invite.userId || 'N/A'}</Table.Cell>
				<Table.Cell>{moment(invite.issuedAt).format('YYYY-MM-DD HH:MM:ss')}</Table.Cell>
				<Table.Cell>{invite.expiresAt ? moment(invite.expiresAt).format('YYYY-MM-DD HH:MM:ss') : 'Never'}</Table.Cell>
				<Table.Cell>{invite.lastSentAt ? moment(invite.lastSentAt).format('YYYY-MM-DD HH:MM:ss') : 'Never'}</Table.Cell>
				<Table.Cell>
					<div class="inline-flex rounded-lg shadow-sm float-right">
						<Button
							variant="outline"
							size="sm"
						>
							<Trash2 class="w-4 h-4" />
						</Button>
					</div>
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
			action="#"
		>
			<div class="grid grid-cols-3 gap-4">
				<div class="space-y-2">
					<Label for="code">Code</Label>
					<Input
						type="text"
						name="code"
						id="code"
						maxlength={6}
					/>
					<p class="text-xs text-muted-foreground">Leave blank to auto-generate a unique code.</p>
				</div>
				<div class="space-y-2 col-span-2">
					<Label for="expiration">Expiration</Label>
					<Input
						type="date"
						name="expiration"
						id="expiration"
						bind:value={selectedDate}
					/>
					<p class="text-xs text-muted-foreground">Optionally set an invitation expiry date.</p>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input
					type="email"
					name="email"
					id="email"
				/>
				<p class="text-xs text-muted-foreground">Optionally assign this invitation to a specific user's email.</p>
			</div>
			<Dialog.Footer>
				<Button type="submit" size="lg" class="w-full">
					Create Invite
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
