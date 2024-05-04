<script lang="ts">
  import type { User } from "$lib/types";
  import {
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
  } from "flowbite-svelte-icons";
  import { Dropdown, DropdownItem } from "flowbite-svelte";
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher();
  const editUser = (user: User) => {
    dispatch('toggle', { user })
  }
  export let users: User[];
</script>

<Table>
  <TableHead>
    <TableHeadCell>User ID</TableHeadCell>
    <TableHeadCell>Username</TableHeadCell>
    <TableHeadCell>
      <span class="sr-only">Edit</span>
    </TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each users as user}
      <TableBodyRow>
        <TableBodyCell>{user.userId}</TableBodyCell>
        <TableBodyCell>{user.username}</TableBodyCell>
        <TableBodyCell>
          <button
            type="button"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            id="drop">
            <DotsVerticalOutline></DotsVerticalOutline>
          </button>
          <Dropdown placement="right-end" triggeredBy="#drop">
            <DropdownItem class="items-center flex gap-4" on:click={() => editUser(user)}>
              <UserEditOutline />Edit User
            </DropdownItem>
            <DropdownItem
              class="text-red-700 dark:text-red-500 items-center flex gap-4">
              <UserRemoveOutline></UserRemoveOutline>Delete User
            </DropdownItem>
          </Dropdown>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
