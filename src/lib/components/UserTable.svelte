<script lang="ts">
  import type { User } from "$lib/types";
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
  import {
    DotsVerticalOutline,
    UserRemoveOutline,
    UserEditOutline,
    AdjustmentsVerticalOutline,
    DownloadSolid,
    UserCircleSolid,
  } from "flowbite-svelte-icons";
  import { Dropdown, DropdownItem } from "flowbite-svelte";
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher();

  export let users: User[];
</script>

<Table>
  <TableHead>
    <TableHeadCell>User ID</TableHeadCell>
    <TableHeadCell>Username</TableHeadCell>
    <TableHeadCell>
      <span class="sr-only">Actions</span>
    </TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each users as user}
      <TableBodyRow>
        <TableBodyCell>{user.userId}</TableBodyCell>
        <TableBodyCell>{user.username}</TableBodyCell>
        <TableBodyCell>
          <ButtonGroup size="sm" divClass="inline-flex rounded-lg shadow-sm float-right">
            <Button outline color="dark" on:click={() => dispatch('toggle', { user })}>
              <UserCircleSolid class="w-4 h-4" />
            </Button>
            <Button outline color="dark">
              <AdjustmentsVerticalOutline class="w-4 h-4" />
            </Button>
          </ButtonGroup>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
