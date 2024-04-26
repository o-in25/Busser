<script lang="ts">
  import type { PageData } from "./$types";
  import { Tabs, TabItem, Label, Heading, Button } from "flowbite-svelte";
  import {
    UsersOutline,
    AdjustmentsVerticalSolid,
    PlusOutline,
  } from "flowbite-svelte-icons";
  import { DarkMode } from "flowbite-svelte";
  import UserTable from "$lib/components/UserTable.svelte";
  import AddUserForm from "$lib/components/AddUserForm.svelte";

  export let data: PageData;
	let modal: AddUserForm; 

</script>

<Tabs tabStyle="underline">
  <TabItem open>
    <div slot="title" class="flex items-center gap-2">
      <AdjustmentsVerticalSolid size="md" />General
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400">
      <Heading tag="h4" class="mb-4 flex flex-row justify-between">
        General Settings
      </Heading>
      <div class="flex justify-left items-center">
        <DarkMode
          class="text-primary-500 dark:text-primary-600 border dark:border-gray-800" />
        <Label class="ms-2 text-center">Dark Mode</Label>
      </div>
    </div>
  </TabItem>
  <TabItem>
    <div slot="title" class="flex items-center gap-2">
      <UsersOutline size="md" />Users
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400">
      <Heading tag="h4" class="mb-4 flex flex-row justify-between">
        User Management
        <Button size="xs" class="items-center flex gap-4" on:click={modal.toggle}>
          <PlusOutline />Add User
        </Button>
      </Heading>
      <AddUserForm bind:this={modal}></AddUserForm>
    </div>

    <UserTable users={data?.users || []}></UserTable>
  </TabItem>
</Tabs>
