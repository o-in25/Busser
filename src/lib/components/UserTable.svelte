<script lang="ts">
  import type { User } from "$lib/types";
  import { EditOutline, TrashBinOutline, UserEditOutline, UserRemoveOutline } from "flowbite-svelte-icons";
  import { createEventDispatcher } from 'svelte'
  import {
    Button,
    ButtonGroup,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";

  const dispatch = createEventDispatcher();
  export let users: User[];
</script>

<Table>
  <TableHead>
    <TableHeadCell>User ID</TableHeadCell>
    <TableHeadCell>Username</TableHeadCell>
    <TableHeadCell>Email</TableHeadCell>
    <TableHeadCell>
      <span class="sr-only">Actions</span>
    </TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each users as user}
      <TableBodyRow>
        <TableBodyCell>{user.userId}</TableBodyCell>
        <TableBodyCell>{user.username}</TableBodyCell>
        <TableBodyCell>{user.email}</TableBodyCell>
        <TableBodyCell>
          <ButtonGroup size="sm" divClass="inline-flex rounded-lg shadow-sm float-right">
            <Button outline color="dark" on:click={() => dispatch('modalControl', { state: 'open', action: 'edit', payload: { user } })}>
              <UserEditOutline class="w-4 h-4" />
            </Button>
            <Button outline color="dark">
              <UserRemoveOutline class="w-4 h-4" />
            </Button>
          </ButtonGroup>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
