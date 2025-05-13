<script lang="ts">
	import {
		Button,
		Modal,
		Label,
		Checkbox,
		Input,
		Datepicker,
		P,
		Table,
		TableHeadCell,
		TableBody,
		TableBodyCell,
		TableHead,
		TableBodyRow,
		ButtonGroup,
		Helper,
	} from 'flowbite-svelte';
	import type { PageData } from './$types';
	import { PlusOutline, TrashBinOutline, UserAddOutline } from 'flowbite-svelte-icons';
	import moment from 'moment';

	let { data }: { data: PageData } = $props();
	let formModal = $state(false);
	let selectedDate = $state(null);
</script>

<Table striped={true}>
	<TableHead>
		<TableHeadCell>Invite Code</TableHeadCell>
    <TableHeadCell>Used By</TableHeadCell>
		<TableHeadCell>Issued At</TableHeadCell>
		<TableHeadCell>Expires At</TableHeadCell>
    <TableHeadCell>Last Sent At</TableHeadCell>
		<TableHeadCell>
			<ButtonGroup
				size="sm"
				divClass="inline-flex rounded-lg shadow-sm float-right"
			>
				<Button
					outline
					color="dark"
          onclick={() => (formModal = true)}
				>
					<PlusOutline class="w-4 h-4" />
				</Button>
			</ButtonGroup>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
    {#each data.invitations as invite}
    <TableBodyRow>
			<TableBodyCell>{invite.invitationCode}</TableBodyCell>
      <TableBodyCell>{invite.userId || 'N/A'}</TableBodyCell>
			<TableBodyCell>{moment(invite.issuedAt).format('YYYY-MM-DD HH:MM:ss')}</TableBodyCell>
      <TableBodyCell>{invite.expiresAt? moment(invite.expiresAt).format('YYYY-MM-DD HH:MM:ss') : 'Never'}</TableBodyCell>
      <TableBodyCell>{invite.lastSentAt? moment(invite.lastSentAt).format('YYYY-MM-DD HH:MM:ss') : 'Never'}</TableBodyCell>

      <TableBodyCell>
        <ButtonGroup
          size="sm"
          divClass="inline-flex rounded-lg shadow-sm float-right"
        >
            <Button
              outline
              color="dark"

            >
              <TrashBinOutline class="w-4 h-4" />
            </Button>
        </ButtonGroup>
      </TableBodyCell>
		</TableBodyRow>
    {/each}
	</TableBody>
</Table>
<Modal
	bind:open={formModal}
	size="lg"
	autoclose={false}
	class="w-full"
>
	<form
		class="h-[60dvh] flex flex-col justify-between"
		action="#"
	>
  <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Create Invite</h3>
  <div class="space-y-6">
      <div class="grid grid-cols-3 gap-4">
			<Label class="space-y-2">
				<span>Code</span>
				<Input
					type="text"
					name="code"
          maxlength={6}
				/>
        <Helper class="text-xs">Leave blank to auto-generate a unique code.</Helper>

			</Label>
      <Label class="space-y-2 col-span-2">
				<span>Expiration</span>
				<Datepicker bind:value={selectedDate} />
        <Helper class="text-xs">Optionally set an invitation expiry date.</Helper>
			</Label>
      </div>
			<Label class="space-y-2">
				<span>Email</span>
				<Input
					type="email"
					name="email"
				/>
        <Helper class="text-xs">Optionally assign this invitation to a specific user's email.</Helper>
			</Label>
	
		</div>
		<Button
			type="submit"
			class="mt-auto"
			size="lg"
		>
			Create Invite
		</Button>
	</form>
</Modal>
