<script lang="ts">
  import type { User } from "$lib/types";
  import { EditOutline, TrashBinOutline, UserAddOutline, UserEditOutline, UserRemoveOutline } from "flowbite-svelte-icons";
  import { createEventDispatcher } from 'svelte'
  import {
    A,
    Button,
    ButtonGroup,
    Modal,
    P,
    Span,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";

  export let users: User[];
  let target: string | undefined = undefined;
  let defaultModal = false;

  const deleteUser = async (userId: string) => {
    const result = await fetch('/api/ci', {
      method: 'POST',
    });
  }

</script>

<Table>
  <TableHead>
    <TableHeadCell>Username</TableHeadCell>
    <TableHeadCell>Email</TableHeadCell>
    <TableHeadCell>
      <ButtonGroup size="sm" divClass="inline-flex rounded-lg shadow-sm float-right">
        <Button outline color="dark" href="/settings/users/add">
          <UserAddOutline class="w-4 h-4" />
        </Button>
      </ButtonGroup>
    </TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each users as user}
      <TableBodyRow>
        <TableBodyCell>{user.username}</TableBodyCell>
        <TableBodyCell>{user.email}</TableBodyCell>
        <TableBodyCell>
          <ButtonGroup size="sm" divClass="inline-flex rounded-lg shadow-sm float-right">
            <Button outline color="dark" href="/settings/users/{user.userId}/edit">
              <UserEditOutline class="w-4 h-4" />
            </Button>
            <Button outline color="dark" on:click={() => {
              defaultModal = true;
              target = user.userId;
            }}>
              <UserRemoveOutline class="w-4 h-4" />
            </Button>
          </ButtonGroup>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
<Modal title="Delete User" bind:open={defaultModal} autoclose>
  <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
    Delete user <Span>{users.find(({ userId }) => target === userId)?.username}</Span>?
    <P color="text-red-700 dark:text-red-500" weight="bold">Once deleted, this user can't be recovered.</P>


  </p>
  <svelte:fragment slot="footer">
    <Button color="red" on:click={() => alert('Handle "success"')}>Delete</Button>
    <Button color="alternative" on:click={() => target = undefined}>Cancel</Button>
  </svelte:fragment>
</Modal>
