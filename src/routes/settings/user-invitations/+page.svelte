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
	} from 'flowbite-svelte';
	import type { PageData } from './$types';
	import { UserAddOutline } from 'flowbite-svelte-icons';

	let { data }: { data: PageData } = $props();
	let formModal = $state(false);
	let selectedDate = $state(null);
</script>

<Button on:click={() => (formModal = true)}>Form modal</Button>
<Table striped={true}>
	<TableHead>
		<TableHeadCell>Product name</TableHeadCell>
		<TableHeadCell>Color</TableHeadCell>
		<TableHeadCell>Category</TableHeadCell>
    <TableHeadCell>
      Code
    </TableHeadCell>
		<TableHeadCell>
			<ButtonGroup
				size="sm"
				divClass="inline-flex rounded-lg shadow-sm float-right"
			>
				<Button
					outline
					color="dark"
					href="/settings/users/add"
				>
					<UserAddOutline class="w-4 h-4" />
				</Button>
			</ButtonGroup>		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		<TableBodyRow>
			<TableBodyCell>Apple MacBook Pro 17"</TableBodyCell>
			<TableBodyCell>Sliver</TableBodyCell>
			<TableBodyCell>Laptop</TableBodyCell>
			<TableBodyCell>$2999</TableBodyCell>
			<TableBodyCell>
				<a
					href="/tables"
					class="font-medium text-primary-600 hover:underline dark:text-primary-500"
				>
					Edit
				</a>
			</TableBodyCell>
		</TableBodyRow>
	</TableBody>
</Table>
<Modal
	bind:open={formModal}
	size="lg"
	autoclose={false}
	class="w-full"
>
	<form
		class="h-[50dvh] flex flex-col justify-between space-y-6"
		action="#"
	>
		<!-- <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Sign in to our platform</h3> -->
		<div class="space-y-6">
			<Label class="space-y-2">
				<span>Code</span>
				<Input
					type="email"
					name="email"
					placeholder="name@company.com"
					required
				/>
			</Label>
			<Label class="space-y-2">
				<span>Email</span>
				<Input
					type="email"
					name="email"
					placeholder="name@company.com"
					required
				/>
			</Label>
			<Label class="space-y-2">
				<span>Expiration</span>
				<Datepicker bind:value={selectedDate} />
			</Label>
		</div>
		<Button
			type="submit"
			class="mt-auto"
			size="lg"
		>
			Login to your account
		</Button>
	</form>
</Modal>
